import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { perfilAtual, pode } from "@/lib/permissoes";

/** A liderança remove a conta de um membro. */
export async function DELETE(req, { params }) {
  const { id } = await params;

  const perfil = await perfilAtual();
  if (!perfil) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  if (!pode(perfil, "membros:editar")) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }
  if (id === perfil.id) {
    return NextResponse.json(
      { erro: "Para apagar a própria conta, use a página Meu perfil." },
      { status: 400 }
    );
  }

  const admin = supabaseAdmin();

  const { data: alvo } = await admin.from("perfis").select("id, nome").eq("id", id).maybeSingle();
  if (!alvo) return NextResponse.json({ erro: "Membro não encontrado" }, { status: 404 });

  const { error: erroPerfil } = await admin.from("perfis").delete().eq("id", id);
  if (erroPerfil) {
    const msg = /último líder/i.test(erroPerfil.message)
      ? "Essa pessoa é o único líder do ministério. Promova outro líder antes de remover."
      : "Não deu para remover: " + erroPerfil.message;
    return NextResponse.json({ erro: msg }, { status: 400 });
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json({ erro: "Perfil removido, mas a conta permaneceu: " + error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
