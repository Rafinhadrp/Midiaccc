import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { perfilAtual, pode } from "@/lib/permissoes";
import { enviarEmail } from "@/lib/envio/email";

/**
 * Redefinição de senha de outra pessoa, para quem tem 'membros:editar'.
 *
 * modo 'link'       manda um link por e-mail para a pessoa criar a própria
 *                   senha. É o caminho recomendado: você nunca fica sabendo
 *                   a senha dela.
 * modo 'temporaria' define uma senha na hora, para quando a pessoa não tem
 *                   acesso ao e-mail. Use e peça para ela trocar depois.
 */
export async function POST(req, { params }) {
  const { id } = await params;
  const { modo = "link", senha } = await req.json();

  const perfil = await perfilAtual();
  if (!perfil) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  if (!pode(perfil, "membros:editar")) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const admin = supabaseAdmin();

  const { data: alvo } = await admin
    .from("perfis")
    .select("id, nome, email")
    .eq("id", id)
    .single();

  if (!alvo) return NextResponse.json({ erro: "Membro não encontrado" }, { status: 404 });

  // ---- senha temporária ----
  if (modo === "temporaria") {
    if (!senha || senha.length < 8) {
      return NextResponse.json(
        { erro: "A senha temporária precisa ter pelo menos 8 caracteres." },
        { status: 400 }
      );
    }

    const { error } = await admin.auth.admin.updateUserById(id, { password: senha });
    if (error) {
      return NextResponse.json({ erro: "Não deu para trocar: " + error.message }, { status: 500 });
    }

    await admin.from("notificacoes").insert({
      perfil_id: id,
      canal: "email",
      tipo: "senha_temporaria",
      destino: alvo.email,
      conteudo: `Senha temporária definida por ${perfil.nome}`,
      status: "enviado",
    });

    return NextResponse.json({ ok: true, modo: "temporaria" });
  }

  // ---- link de redefinição ----
  const { data: linkData, error: erroLink } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: alvo.email,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/redefinir-senha` },
  });

  if (erroLink) {
    return NextResponse.json({ erro: "Não deu para gerar o link: " + erroLink.message }, { status: 500 });
  }

  const link = linkData?.properties?.action_link;
  const primeiro = alvo.nome.trim().split(/\s+/)[0];

  const resultado = await enviarEmail({
    para: alvo.email,
    assunto: "Redefinição de senha — Ministério de Multimídia",
    texto: `Olá, ${primeiro}!

A liderança gerou um link para você criar uma nova senha de acesso ao sistema do ministério.

${link}

O link vale por uma hora e só pode ser usado uma vez. Se não foi você quem pediu, é só ignorar.

Ministério de Multimídia`,
  });

  await admin.from("notificacoes").insert({
    perfil_id: id,
    canal: "email",
    tipo: "redefinicao_senha",
    destino: alvo.email,
    conteudo: "Link de redefinição de senha",
    status: resultado.ok ? "enviado" : "erro",
    erro: resultado.ok ? null : resultado.erro,
  });

  return NextResponse.json({
    ok: true,
    modo: "link",
    enviado: resultado.ok,
    erroEnvio: resultado.ok ? null : resultado.erro,
  });
}
