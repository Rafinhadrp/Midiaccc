import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { perfilAtual, pode } from "@/lib/permissoes";
import { enviarEmail } from "@/lib/envio/email";
import { enviarWhatsapp } from "@/lib/envio/whatsapp";
import {
  textoAprovado, textoRecusado, assuntoAprovado, assuntoRecusado,
} from "@/lib/mensagens";

/**
 * Aprova ou recusa uma inscrição e dispara a mensagem.
 * Ao aprovar: cria o usuário, o perfil, as funções e manda o convite.
 */
export async function POST(req, { params }) {
  const { id } = await params;
  const { decisao, canal = "email", textoPersonalizado } = await req.json();

  if (!["aprovado", "recusado"].includes(decisao)) {
    return NextResponse.json({ erro: "Decisão inválida" }, { status: 400 });
  }

  const perfil = await perfilAtual();
  if (!perfil) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  if (!pode(perfil, "inscricoes:aprovar")) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const supabase = await supabaseServidor();
  const admin = supabaseAdmin();

  const { data: insc } = await supabase.from("inscricoes").select("*").eq("id", id).single();
  if (!insc) return NextResponse.json({ erro: "Inscrição não encontrada" }, { status: 404 });
  if (insc.status !== "pendente") {
    return NextResponse.json({ erro: "Essa inscrição já foi decidida." }, { status: 409 });
  }

  const { data: listaFuncoes } = await admin.from("funcoes").select("id, nome");
  const nomesFuncoes = insc.funcoes.map(
    (f) => listaFuncoes?.find((x) => x.id === f)?.nome ?? f
  );

  // ---- cria acesso quando aprovado ----
  let linkAcesso = `${process.env.NEXT_PUBLIC_SITE_URL}/login`;
  let avisoAcesso = null;

  if (decisao === "aprovado") {
    const criado = await criarAcesso(admin, insc);
    if (criado.erro) avisoAcesso = criado.erro;
    if (criado.link) linkAcesso = criado.link;
  }

  // ---- atualiza a inscrição ----
  const { error: erroUpdate } = await supabase
    .from("inscricoes")
    .update({ status: decisao, decidido_por: perfil.id, decidido_em: new Date().toISOString() })
    .eq("id", id);

  if (erroUpdate) {
    return NextResponse.json({ erro: "Não foi possível atualizar a inscrição." }, { status: 500 });
  }

  // ---- monta e envia a mensagem ----
  const texto =
    textoPersonalizado?.trim() ||
    (decisao === "aprovado"
      ? textoAprovado({ nome: insc.nome, funcoes: nomesFuncoes, linkAcesso })
      : textoRecusado({ nome: insc.nome }));

  const destino = canal === "whatsapp" ? insc.telefone : insc.email;

  const resultado =
    canal === "whatsapp"
      ? await enviarWhatsapp({
          para: insc.telefone,
          texto,
          template:
            decisao === "aprovado"
              ? process.env.WHATSAPP_TEMPLATE_APROVADO
              : process.env.WHATSAPP_TEMPLATE_RECUSADO,
          variaveis:
            decisao === "aprovado"
              ? [insc.nome.split(" ")[0], nomesFuncoes.join(", "), linkAcesso]
              : [insc.nome.split(" ")[0]],
        })
      : await enviarEmail({
          para: insc.email,
          assunto: decisao === "aprovado" ? assuntoAprovado() : assuntoRecusado(),
          texto,
        });

  await admin.from("notificacoes").insert({
    inscricao_id: id,
    canal,
    tipo: decisao,
    destino,
    conteudo: texto,
    status: resultado.ok ? "enviado" : "erro",
    erro: resultado.ok ? null : resultado.erro,
  });

  return NextResponse.json({
    ok: true,
    enviado: resultado.ok,
    erroEnvio: resultado.ok ? null : resultado.erro,
    avisoAcesso,
  });
}

/** Cria usuário + perfil + funções. Devolve o link para definir a senha. */
async function criarAcesso(admin, insc) {
  const { data: criado, error } = await admin.auth.admin.createUser({
    email: insc.email,
    email_confirm: true,
    user_metadata: { nome: insc.nome },
  });

  let userId = criado?.user?.id;

  // Se já existia um usuário com esse e-mail, reaproveita
  if (error && /already/i.test(error.message)) {
    const { data: lista } = await admin.auth.admin.listUsers();
    userId = lista?.users?.find((u) => u.email === insc.email)?.id;
  } else if (error) {
    return { erro: `Usuário não criado: ${error.message}` };
  }

  if (!userId) return { erro: "Não foi possível identificar o usuário criado." };

  // Quem já tem perfil mantém tudo como está — papel, foto e dados.
  // Sem isso, um membro antigo que se inscrevesse de novo seria rebaixado.
  const { data: existente } = await admin
    .from("perfis")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!existente) {
    const { error: erroPerfil } = await admin.from("perfis").insert({
      id: userId,
      nome: insc.nome,
      email: insc.email,
      telefone: insc.telefone,
      foto_url: insc.foto_url,
      papel_id: "voluntario",
    });
    if (erroPerfil) return { erro: `Perfil não criado: ${erroPerfil.message}` };
  }

  // As funções continuam sendo somadas: se a pessoa se inscreveu para
  // aprender uma função nova, ela se junta às que já tinha.
  if (insc.funcoes?.length) {
    await admin
      .from("perfil_funcoes")
      .upsert(insc.funcoes.map((f) => ({ perfil_id: userId, funcao_id: f })));
  }

  // Link de convite para a pessoa criar a própria senha
  const { data: linkData } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: insc.email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/redefinir-senha` },
  });

  return { link: linkData?.properties?.action_link ?? null };
}
