import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/server";

/**
 * Volta do Google (e de qualquer link com código).
 *
 * Depois de criar a sessão, decide para onde mandar a pessoa:
 *  - já tem perfil        -> painel
 *  - já tem inscrição     -> tela de espera
 *  - acabou de chegar     -> completar cadastro
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
        `/login?erro=${encodeURIComponent("Não foi possível concluir a entrada. Tente de novo.")}`,
        url.origin
      )
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", url.origin));

  const { data: perfil } = await supabase
    .from("perfis").select("id").eq("id", user.id).maybeSingle();

  if (perfil) return NextResponse.redirect(new URL("/painel", url.origin));

  const { data: insc } = await supabase
    .from("inscricoes").select("id").eq("email", user.email).maybeSingle();

  return NextResponse.redirect(
    new URL(insc ? "/aguardando" : "/completar-cadastro", url.origin)
  );
}
