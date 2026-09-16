import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { perfilAtual, pode } from "@/lib/permissoes";
import Topo from "@/components/Topo";
import ListaMembros from "@/components/ListaMembros";

export const dynamic = "force-dynamic";

export default async function PaginaMembros() {
  const perfil = await perfilAtual();
  if (!pode(perfil, "membros:ver")) redirect("/painel");

  const supabase = await supabaseServidor();
  const [{ data: membros }, { data: funcoes }, { data: papeis }] = await Promise.all([
    supabase.from("perfis").select("*, perfil_funcoes(funcao_id)").order("nome"),
    supabase.from("funcoes").select("*").order("ordem"),
    supabase.from("papeis").select("*").order("nome"),
  ]);

  return (
    <>
      <Topo titulo="Membros" sub={`${membros?.length ?? 0} pessoas no ministério`} />
      <div className="content">
        <ListaMembros
          membros={(membros ?? []).map((m) => ({
            ...m,
            funcoes: (m.perfil_funcoes ?? []).map((f) => f.funcao_id),
          }))}
          funcoes={funcoes ?? []}
          papeis={papeis ?? []}
          podeEditar={pode(perfil, "membros:editar")}
          meuId={perfil.id}
        />
      </div>
    </>
  );
}
