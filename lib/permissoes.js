import { supabaseServidor } from "@/lib/supabase/server";

/** Carrega o perfil da pessoa logada com suas permissões já resolvidas. */
export async function perfilAtual() {
  const supabase = await supabaseServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select("*, papeis(nome), perfil_funcoes(funcao_id)")
    .eq("id", user.id)
    .single();

  if (!perfil) return null;

  const { data: permissoes } = await supabase
    .from("papel_permissoes")
    .select("permissao_id")
    .eq("papel_id", perfil.papel_id);

  return {
    ...perfil,
    papelNome: perfil.papeis?.nome ?? perfil.papel_id,
    funcoes: (perfil.perfil_funcoes ?? []).map((f) => f.funcao_id),
    permissoes: (permissoes ?? []).map((p) => p.permissao_id),
  };
}

export function pode(perfil, permissao) {
  return Boolean(perfil?.permissoes?.includes(permissao));
}
