import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/server";

/**
 * Ponto de chegada dos links enviados por e-mail (recuperação de senha,
 * convite de acesso). O link traz um código de uso único; aqui ele é
 * trocado por uma sessão de verdade, e só então a pessoa segue adiante.
 */
export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const proximo = url.searchParams.get("next") || "/painel";

  // O Supabase devolve o erro na própria URL quando o link expirou
  const erroUrl = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (erroUrl) {
    return NextResponse.redirect(
      new URL(`/login?erro=${encodeURIComponent(erroUrl)}`, url.origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?erro=Link%20inv%C3%A1lido%20ou%20incompleto", url.origin)
    );
  }

  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?erro=${encodeURIComponent("O link expirou ou já foi usado. Peça um novo.")}`,
        url.origin
      )
    );
  }

  return NextResponse.redirect(new URL(proximo, url.origin));
}
