import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { perfilAtual, pode } from "@/lib/permissoes";
import Topo from "@/components/Topo";
import MatrizAcessos from "@/components/MatrizAcessos";

export const dynamic = "force-dynamic";

export default async function PaginaAcessos() {
  const perfil = await perfilAtual();
  if (!pode(perfil, "acessos:gerenciar")) redirect("/painel");

  const supabase = await supabaseServidor();
  const [{ data: papeis }, { data: permissoes }, { data: vinculos }] = await Promise.all([
    supabase.from("papeis").select("*"),
    supabase.from("permissoes").select("*"),
    supabase.from("papel_permissoes").select("*"),
  ]);

  return (
    <>
      <Topo titulo="Acessos" sub="Quem pode ver e fazer o quê" />
      <div className="content">
        <MatrizAcessos
          papeis={papeis ?? []}
          permissoes={permissoes ?? []}
          vinculosIniciais={vinculos ?? []}
        />
      </div>
    </>
  );
}
