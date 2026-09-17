import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Conclui o cadastro de quem entrou pelo Google.
 * Cria a inscrição ligada à conta que já existe.
 */
export async function POST(req) {
  const supabase = await supabaseServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  let corpo;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido" }, { status: 400 });
  }

  const { nome, telefone, nascimento, funcoes, experiencia, disponibilidade } = corpo;

  if (!nome?.trim()) {
    return NextResponse.json({ erro: "Informe seu nome." }, { status: 400 });
  }

  const digitos = String(telefone ?? "").replace(/\D/g, "");
  if (digitos.length < 10) {
    return NextResponse.json({ erro: "Informe um WhatsApp válido com DDD." }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data: jaTem } = await admin
    .from("inscricoes").select("id").eq("email", user.email).maybeSingle();

  if (jaTem) {
    return NextResponse.json({ erro: "Seu cadastro já foi enviado." }, { status: 409 });
  }

  const meta = user.user_metadata ?? {};

  const { error } = await admin.from("inscricoes").insert({
    nome: nome.trim(),
    telefone: telefone.trim(),
    email: user.email,
    data_nascimento: nascimento || null,
    funcoes: Array.isArray(funcoes) ? funcoes : [],
    experiencia: experiencia?.trim() || null,
    disponibilidade: disponibilidade?.trim() || null,
    foto_url: meta.avatar_url ?? meta.picture ?? null,
    origem: "google",
    user_id: user.id,
  });

  if (error) {
    console.error("Falha ao concluir cadastro:", error);
    return NextResponse.json({ erro: "Não foi possível salvar o cadastro." }, { status: 500 });
  }

  // Deixa o nome atualizado também na conta
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...meta, nome: nome.trim() },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
