import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** A pessoa apaga a própria conta. Não tem volta. */
export async function POST() {
  const supabase = await supabaseServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const admin = supabaseAdmin();

  // O trigger no banco recusa a remoção do último líder
  const { error: erroPerfil } = await admin.from("perfis").delete().eq("id", user.id);
  if (erroPerfil) {
    return NextResponse.json({ erro: traduzir(erroPerfil.message) }, { status: 400 });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ erro: "Não deu para apagar a conta: " + error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function traduzir(msg) {
  if (/último líder/i.test(msg)) {
    return "Você é o único líder do ministério. Passe a liderança para outra pessoa antes de sair.";
  }
  return "Não deu para apagar a conta: " + msg;
}
