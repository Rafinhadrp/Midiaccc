import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Cadastro simples, sem o questionário da inscrição.
 *
 * Serve para quem chega com o formulário fechado ou só quer ter
 * conta. Cria a conta e um registro em `inscricoes` com origem
 * 'cadastro' e nenhuma função escolhida, para que a liderança veja
 * a pessoa na mesma lista e decida.
 */
export async function POST(req) {
  let corpo;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido" }, { status: 400 });
  }

  const { nome, telefone, email, senha } = corpo;

  if (!nome?.trim() || !email?.trim() || !senha) {
    return NextResponse.json({ erro: "Preencha nome, e-mail e senha." }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    return NextResponse.json({ erro: "E-mail inválido." }, { status: 400 });
  }
  if (senha.length < 8) {
    return NextResponse.json({ erro: "A senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const emailLimpo = email.trim().toLowerCase();

  const { data: jaMembro } = await supabase
    .from("perfis").select("id").eq("email", emailLimpo).maybeSingle();

  if (jaMembro) {
    return NextResponse.json(
      { erro: "Esse e-mail já tem conta no sistema. É só fazer login." },
      { status: 409 }
    );
  }

  const { data: jaPendente } = await supabase
    .from("inscricoes").select("id").eq("email", emailLimpo).eq("status", "pendente").maybeSingle();

  if (jaPendente) {
    return NextResponse.json(
      { erro: "Você já tem um cadastro aguardando resposta." },
      { status: 409 }
    );
  }

  const { data: criado, error: erroUser } = await supabase.auth.admin.createUser({
    email: emailLimpo,
    password: senha,
    email_confirm: true,
    user_metadata: { nome: nome.trim() },
  });

  let userId = criado?.user?.id;

  if (erroUser && /already/i.test(erroUser.message)) {
    const { data: lista } = await supabase.auth.admin.listUsers();
    userId = lista?.users?.find((u) => u.email === emailLimpo)?.id;
    if (userId) await supabase.auth.admin.updateUserById(userId, { password: senha });
  } else if (erroUser) {
    console.error("Falha ao criar usuário:", erroUser);
    return NextResponse.json({ erro: "Não foi possível criar sua conta." }, { status: 500 });
  }

  const { error } = await supabase.from("inscricoes").insert({
    nome: nome.trim(),
    telefone: telefone?.trim() || "não informado",
    email: emailLimpo,
    funcoes: [],
    origem: "cadastro",
    user_id: userId ?? null,
  });

  if (error) {
    console.error("Falha ao gravar cadastro:", error);
    return NextResponse.json({ erro: "Não foi possível salvar o cadastro." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
