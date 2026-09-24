import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { perfilAtual, pode } from "@/lib/permissoes";
import Topo from "@/components/Topo";
import GerenciarEventos from "@/components/GerenciarEventos";

export const dynamic = "force-dynamic";

export default async function PaginaEventos() {
  const perfil = await perfilAtual();
  if (!pode(perfil, "eventos:gerenciar")) redirect("/painel");

  const supabase = await supabaseServidor();
  await supabase.rpc("expirar_pedidos_vencidos");

  const [{ data: eventos }, { data: pedidos }] = await Promise.all([
    supabase.from("eventos_pagos").select("*").order("data_evento", { nullsFirst: false }),
    supabase.from("pedidos").select("*").order("criado_em", { ascending: false }),
  ]);

  const pedidosPorEvento = {};
  (pedidos ?? []).forEach((p) => {
    (pedidosPorEvento[p.evento_id] ??= []).push(p);
  });

  const pagos = (pedidos ?? []).filter((p) => p.status === "pago");

  const resumo = {
    totalCentavos: pagos.reduce((s, p) => s + p.valor_centavos, 0),
    ingressosPagos: pagos.reduce((s, p) => s + p.quantidade, 0),
    pendentes: (pedidos ?? []).filter((p) => p.status === "pendente").length,
    presentes: pagos.filter((p) => p.checkin_em).reduce((s, p) => s + p.quantidade, 0),
  };

  return (
    <>
      <Topo titulo="Eventos" sub="Ingressos, pedidos e caixa" />
      <div className="content">
        <GerenciarEventos
          eventos={eventos ?? []}
          pedidosPorEvento={pedidosPorEvento}
          resumo={resumo}
        />
      </div>
    </>
  );
}
