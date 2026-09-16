import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const LIMITE_FOTO = 3 * 1024 * 1024; // 3 MB

/**
 * Recebe a inscrição do formulário público.
 *
 * A conta é criada já aqui, com a senha que a pessoa escolheu, mas
 * SEM perfil. Sem perfil ela não entra no painel — fica na tela de
 * espera até a liderança aprovar. Assim ninguém precisa inventar
 * senha duas vezes nem depender de link por e-mail para entrar.
 */
export async function POST(req) {
  let corpo;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido" }, { status: 400 });
  }

  const {
    nome, idade, telefone, email, funcoes,
    experiencia, disponibilidade, foto, senha,
  } = corpo;

  if (!nome?.trim() || !telefone?.trim() || !email?.trim() || !Array.isArray(funcoes) || !funcoes.length) {
    return NextResponse.json(
      { erro: "Preencha nome, WhatsApp, e-mail e ao menos uma função." },
      { status: 400 }
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    return NextResponse.json({ erro: "E-mail inválido." }, { status: 400 });
  }
  if (!senha || senha.length < 8) {
    return NextResponse.json({ erro: "A senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const emailLimpo = email.trim().toLowerCase();

  const { data: jaTem } = await supabase
    .from("inscricoes")
    .select("id")
    .eq("email", emailLimpo)
    .eq("status", "pendente")
    .maybeSingle();

  if (jaTem) {
    return NextResponse.json(
      { erro: "Já existe uma inscrição sua aguardando resposta." },
      { status: 409 }
    );
  }

  // Quem já é membro não precisa se inscrever de novo
  const { data: jaMembro } = await supabase
    .from("perfis")
    .select("id")
    .eq("email", emailLimpo)
    .maybeSingle();

  if (jaMembro) {
    return NextResponse.json(
      { erro: "Esse e-mail já tem conta no sistema. Faça login para entrar." },
      { status: 409 }
    );
  }

  // ---- cria (ou reaproveita) a conta ----
  const { data: criado, error: erroUser } = await supabase.auth.admin.createUser({
    email: emailLimpo,
    password: senha,
    email_confirm: true,
    user_metadata: { nome: nome.trim() },
  });

  let userId = criado?.user?.id;

  if (erroUser && /already/i.test(erroUser.message)) {
    // e-mail já existe no Auth sem perfil: atualiza para a senha escolhida agora
    const { data: lista } = await supabase.auth.admin.listUsers();
    userId = lista?.users?.find((u) => u.email === emailLimpo)?.id;
    if (userId) await supabase.auth.admin.updateUserById(userId, { password: senha });
  } else if (erroUser) {
    console.error("Falha ao criar usuário:", erroUser);
    return NextResponse.json({ erro: "Não foi possível criar sua conta." }, { status: 500 });
  }

  let foto_url = null;
  if (foto?.startsWith("data:image/")) {
    foto_url = await subirFoto(supabase, foto, userId ?? emailLimpo.replace(/[^a-z0-9]/g, ""));
  }

  const { data, error } = await supabase
    .from("inscricoes")
    .insert({
      nome: nome.trim(),
      idade: idade ? Number(idade) : null,
      telefone: telefone.trim(),
      email: emailLimpo,
      funcoes,
      experiencia: experiencia?.trim() || null,
      disponibilidade: disponibilidade?.trim() || null,
      foto_url,
      user_id: userId ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Falha ao gravar inscrição:", error);
    return NextResponse.json({ erro: "Não foi possível salvar a inscrição." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}

async function subirFoto(supabase, dataUrl, chave) {
  try {
    const [cabecalho, base64] = dataUrl.split(",");
    const tipo = cabecalho.match(/data:(image\/[a-z+]+);base64/)?.[1];
    if (!tipo) return null;

    const bytes = Buffer.from(base64, "base64");
    if (bytes.length > LIMITE_FOTO) return null;

    const ext = tipo.split("/")[1].replace("jpeg", "jpg");
    const caminho = `${chave}/inscricao-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(caminho, bytes, { contentType: tipo, upsert: true });
    if (error) return null;

    return supabase.storage.from("avatars").getPublicUrl(caminho).data.publicUrl;
  } catch {
    return null;
  }
}
