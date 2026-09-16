import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { perfilAtual, pode } from "@/lib/permissoes";
import Topo from "@/components/Topo";
import ListaInscricoes from "@/components/ListaInscricoes";
import ChaveInscricoes from "@/components/ChaveInscricoes";

export const dynamic = "force-dynamic";

export default async function PaginaInscricoes() {
  const perfil = await perfilAtual();
  if (!pode(perfil, "inscricoes:ver")) redirect("/painel");

  const supabase = await supabaseServidor();
  const [{ data: inscricoes }, { data: funcoes }, { data: config }] = await Promise.all([
    supabase.from("inscricoes").select("*").order("criado_em", { ascending: false }),
    supabase.from("funcoes").select("*").order("ordem"),
    supabase.from("configuracoes").select("valor").eq("chave", "inscricoes_abertas").maybeSingle(),
  ]);

  const pendentes = (inscricoes ?? []).filter((i) => i.status === "pendente").length;
  const podeDecidir = pode(perfil, "inscricoes:aprovar");

  return (
    <>
      <Topo
        titulo="Inscrições"
        sub={pendentes ? `${pendentes} aguardando resposta` : "Nenhuma pendente"}
        acao={
          <ChaveInscricoes
            abertasInicial={config?.valor !== false}
            podeMudar={podeDecidir}
          />
        }
      />
      <div className="content">
        <ListaInscricoes
          inscricoes={inscricoes ?? []}
          funcoes={funcoes ?? []}
          podeDecidir={podeDecidir}
        />
      </div>
    </>
  );
}
