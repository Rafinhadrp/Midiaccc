import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const LIMITE_FOTO = 3 * 1024 * 1024; // 3 MB

/**
 * Recebe a inscrição do formulário público.
 * Grava com service role para que a tabela fique fechada ao anônimo.
 */
export async function POST(req) {
  let corpo;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido" }, { status: 400 });
  }

  const { nome, idade, telefone, email, funcoes, experiencia, disponibilidade, foto } = corpo;

  if (!nome?.trim() || !telefone?.trim() || !email?.trim() || !Array.isArray(funcoes) || !funcoes.length) {
    return NextResponse.json(
      { erro: "Preencha nome, WhatsApp, e-mail e ao menos uma função." },
      { status: 400 }
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    return NextResponse.json({ erro: "E-mail inválido." }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  // Evita inscrição duplicada em aberto
  const { data: jaTem } = await supabase
    .from("inscricoes")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .eq("status", "pendente")
    .maybeSingle();

  if (jaTem) {
    return NextResponse.json(
      { erro: "Já existe uma inscrição sua aguardando resposta." },
      { status: 409 }
    );
  }

  let foto_url = null;
  if (foto?.startsWith("data:image/")) {
    foto_url = await subirFoto(supabase, foto, email.trim().toLowerCase());
  }

  const { data, error } = await supabase
    .from("inscricoes")
    .insert({
      nome: nome.trim(),
      idade: idade ? Number(idade) : null,
      telefone: telefone.trim(),
      email: email.trim().toLowerCase(),
      funcoes,
      experiencia: experiencia?.trim() || null,
      disponibilidade: disponibilidade?.trim() || null,
      foto_url,
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
    const caminho = `inscricoes/${Date.now()}-${chave.replace(/[^a-z0-9]/g, "")}.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(caminho, bytes, { contentType: tipo, upsert: false });
    if (error) return null;

    return supabase.storage.from("avatars").getPublicUrl(caminho).data.publicUrl;
  } catch {
    return null;
  }
}
