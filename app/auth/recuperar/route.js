import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/server";

/**
 * Destino dos links de redefinição de senha.
 *
 * Existe separado do /auth/callback porque o Supabase às vezes
 * descarta a query string do redirectTo, e era isso que jogava a
 * pessoa direto no painel em vez da tela de criar senha. Aqui o
 * destino é fixo, não depende de parâmetro nenhum.
 */
export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const erroUrl = url.searchParams.get("error_description") || url.searchParams.get("error");

  if (erroUrl) {
    return NextResponse.redirect(
      new URL(`/login?erro=${encodeURIComponent(erroUrl)}`, url.origin)
    );
  }
  if (!code) {
    return NextResponse.redirect(
      new URL(`/login?erro=${encodeURIComponent("Link inválido ou incompleto.")}`, url.origin)
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

  return NextResponse.redirect(new URL("/redefinir-senha", url.origin));
}
