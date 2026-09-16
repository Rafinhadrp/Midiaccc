import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { perfilAtual, pode } from "@/lib/permissoes";
import Topo from "@/components/Topo";
import GerenciarAcessos from "@/components/GerenciarAcessos";

export const dynamic = "force-dynamic";

export default async function PaginaAcessos() {
  const perfil = await perfilAtual();
  if (!pode(perfil, "acessos:gerenciar")) redirect("/painel");

  const supabase = await supabaseServidor();
  const [
    { data: papeis }, { data: permissoes }, { data: vinculos },
    { data: funcoes }, { data: pessoas }, { data: aptidoes },
  ] = await Promise.all([
    supabase.from("papeis").select("*").order("nome"),
    supabase.from("permissoes").select("*"),
    supabase.from("papel_permissoes").select("*"),
    supabase.from("funcoes").select("*").order("ordem"),
    supabase.from("perfis").select("papel_id"),
    supabase.from("perfil_funcoes").select("funcao_id"),
  ]);

  // Quantas pessoas usam cada papel e cada função
  const usoPorPapel = {};
  (pessoas ?? []).forEach((p) => {
    usoPorPapel[p.papel_id] = (usoPorPapel[p.papel_id] ?? 0) + 1;
  });

  const usoPorFuncao = {};
  (aptidoes ?? []).forEach((a) => {
    usoPorFuncao[a.funcao_id] = (usoPorFuncao[a.funcao_id] ?? 0) + 1;
  });

  return (
    <>
      <Topo titulo="Acessos" sub="Papéis, permissões e funções do ministério" />
      <div className="content">
        <GerenciarAcessos
          papeis={papeis ?? []}
          permissoes={permissoes ?? []}
          vinculosIniciais={vinculos ?? []}
          funcoes={funcoes ?? []}
          usoPorPapel={usoPorPapel}
          usoPorFuncao={usoPorFuncao}
        />
      </div>
    </>
  );
}
