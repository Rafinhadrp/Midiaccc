import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { perfilAtual, pode } from "@/lib/permissoes";
import Topo from "@/components/Topo";
import EditorEscalas from "@/components/EditorEscalas";

export const dynamic = "force-dynamic";

export default async function PaginaEscalas() {
  const perfil = await perfilAtual();
  if (!pode(perfil, "escalas:ver")) redirect("/painel");

  const supabase = await supabaseServidor();
  const hoje = new Date().toISOString().slice(0, 10);

  const [{ data: eventos }, { data: funcoes }, { data: membros }] = await Promise.all([
    supabase
      .from("eventos")
      .select("*, escalacoes(id, funcao_id, perfil_id, status)")
      .gte("data", hoje)
      .order("data"),
    supabase.from("funcoes").select("*").order("ordem"),
    supabase.from("perfis").select("id, nome, foto_url, perfil_funcoes(funcao_id)").eq("ativo", true).order("nome"),
  ]);

  return (
    <>
      <Topo titulo="Escalas" sub="Próximos cultos e quem está escalado" />
      <div className="content">
        <EditorEscalas
          eventosIniciais={eventos ?? []}
          funcoes={funcoes ?? []}
          membros={(membros ?? []).map((m) => ({
            ...m,
            funcoes: (m.perfil_funcoes ?? []).map((f) => f.funcao_id),
          }))}
          podeEditar={pode(perfil, "escalas:editar")}
          meuId={perfil.id}
        />
      </div>
    </>
  );
}
