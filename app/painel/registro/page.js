import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { perfilAtual, pode } from "@/lib/permissoes";
import Topo from "@/components/Topo";
import ListaRegistro from "@/components/ListaRegistro";

export const dynamic = "force-dynamic";

export default async function PaginaRegistro() {
  const perfil = await perfilAtual();
  if (!pode(perfil, "inscricoes:ver")) redirect("/painel");

  const supabase = await supabaseServidor();

  // Faxina automática: o que tem mais de 30 dias sai daqui
  await supabase.rpc("limpar_notificacoes_antigas");

  const { data: notificacoes } = await supabase
    .from("notificacoes")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(300);

  return (
    <>
      <Topo titulo="Registro" sub="Tudo que o sistema enviou nos últimos 30 dias" />
      <div className="content">
        <ListaRegistro
          notificacoes={notificacoes ?? []}
          podeApagar={pode(perfil, "inscricoes:aprovar")}
        />
      </div>
    </>
  );
}
