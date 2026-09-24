import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServidor } from "@/lib/supabase/server";
import { perfilAtual, pode } from "@/lib/permissoes";
import Topo from "@/components/Topo";
import Icone from "@/components/Icones";
import BotaoCheckin from "@/components/BotaoCheckin";

export const dynamic = "force-dynamic";

export default async function Checkin({ params }) {
  const { codigo } = await params;
  const perfil = await perfilAtual();
  if (!pode(perfil, "eventos:gerenciar")) redirect("/painel");

  const supabase = await supabaseServidor();
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("*, eventos_pagos(nome, data_evento)")
    .eq("codigo", decodeURIComponent(codigo).toUpperCase())
    .maybeSingle();

  return (
    <>
      <Topo titulo="Entrada" sub="Conferência de ingresso" />

      <div className="content" style={{ maxWidth: 480 }}>
        {!pedido ? (
          <div className="card" style={{ padding: 26, textAlign: "center" }}>
            <div className="checkin-ico erro"><Icone nome="fechar" size={26} /></div>
            <h3 style={{ fontSize: 19, marginTop: 14 }}>Código não existe</h3>
            <p className="small muted" style={{ marginTop: 8 }}>
              Confira a digitação. Não libere a entrada com este código.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: 26, textAlign: "center" }}>
            <div className={"checkin-ico " + (pedido.status === "pago" ? (pedido.checkin_em ? "aviso" : "ok") : "erro")}>
              <Icone
                nome={pedido.status === "pago" ? (pedido.checkin_em ? "alerta" : "cheque") : "fechar"}
                size={26}
                strokeWidth={2.2}
              />
            </div>

            <h3 style={{ fontSize: 19, marginTop: 14 }}>
              {pedido.status !== "pago"
                ? "Ingresso não pago"
                : pedido.checkin_em
                  ? "Já usado"
                  : "Pode entrar"}
            </h3>

            <div className="codigo-grande" style={{ margin: "14px 0" }}>{pedido.codigo}</div>

            <div className="checkin-dados">
              <div><span className="muted">Nome</span><strong>{pedido.nome}</strong></div>
              <div><span className="muted">Evento</span><strong>{pedido.eventos_pagos?.nome}</strong></div>
              <div><span className="muted">Pessoas</span><strong>{pedido.quantidade}</strong></div>
            </div>

            {pedido.checkin_em && (
              <p className="small muted" style={{ marginTop: 14 }}>
                Entrada registrada em{" "}
                {new Date(pedido.checkin_em).toLocaleString("pt-BR", {
                  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                })}. Confira com a pessoa antes de liberar de novo.
              </p>
            )}

            {pedido.status === "pago" && !pedido.checkin_em && (
              <div style={{ marginTop: 18 }}>
                <BotaoCheckin pedidoId={pedido.id} />
              </div>
            )}
          </div>
        )}

        <Link className="btn btn-bloco" href="/painel/eventos" style={{ marginTop: 14, textAlign: "center" }}>
          Voltar aos eventos
        </Link>
      </div>
    </>
  );
}
