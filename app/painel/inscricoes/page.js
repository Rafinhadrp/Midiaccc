import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { perfilAtual, pode } from "@/lib/permissoes";
import Topo from "@/components/Topo";
import ListaInscricoes from "@/components/ListaInscricoes";

export const dynamic = "force-dynamic";

export default async function PaginaInscricoes() {
  const perfil = await perfilAtual();
  if (!pode(perfil, "inscricoes:ver")) redirect("/painel");

  const supabase = await supabaseServidor();
  const [{ data: inscricoes }, { data: funcoes }] = await Promise.all([
    supabase.from("inscricoes").select("*").order("criado_em", { ascending: false }),
    supabase.from("funcoes").select("*").order("ordem"),
  ]);

  const pendentes = (inscricoes ?? []).filter((i) => i.status === "pendente").length;

  return (
    <>
      <Topo
        titulo="Inscrições"
        sub={pendentes ? `${pendentes} aguardando resposta` : "Nenhuma pendente"}
      />
      <div className="content">
        <ListaInscricoes
          inscricoes={inscricoes ?? []}
          funcoes={funcoes ?? []}
          podeDecidir={pode(perfil, "inscricoes:aprovar")}
        />
      </div>
    </>
  );
}
