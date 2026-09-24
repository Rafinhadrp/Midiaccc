import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import Marca from "@/components/Marca";
import Rodape from "@/components/Rodape";
import Icone from "@/components/Icones";

export const dynamic = "force-dynamic";

const emReais = (c) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function Ingresso({ params }) {
  const { codigo } = await params;
  const admin = supabaseAdmin();

  const { data: pedido } = await admin
    .from("pedidos")
    .select("*, eventos_pagos(nome, data_evento, hora, local)")
    .eq("codigo", decodeURIComponent(codigo).toUpperCase())
    .maybeSingle();

  const evento = pedido?.eventos_pagos;

  return (
    <div className="pub">
      <div className="pub-inner" style={{ maxWidth: 440 }}>
        <Marca />

        {!pedido ? (
          <div className="pub-card">
            <div className="fechado">
              <h3 style={{ fontSize: 20 }}>Código não encontrado</h3>
              <p className="small muted" style={{ marginTop: 10, marginBottom: 20 }}>
                Confira se digitou certo. O código tem o formato MM-XXXXXX e foi
                mostrado logo depois do pagamento.
              </p>
              <Link className="btn btn-bloco" href="/meu-ingresso">Tentar de novo</Link>
            </div>
          </div>
        ) : (
          <div className="ingresso">
            <div className="ingresso-topo">
              <div className="ingresso-evento">{evento?.nome}</div>
              {evento?.data_evento && (
                <div className="ingresso-quando">
                  {new Date(evento.data_evento + "T12:00:00").toLocaleDateString("pt-BR", {
                    weekday: "long", day: "numeric", month: "long",
                  })}
                  {evento.hora ? ` · ${evento.hora.slice(0, 5)}` : ""}
                </div>
              )}
              {evento?.local && <div className="ingresso-local">{evento.local}</div>}
            </div>

            <div className="ingresso-picote" aria-hidden="true" />

            <div className="ingresso-corpo">
              <div className="ingresso-rotulo">Código</div>
              <div className="codigo-grande">{pedido.codigo}</div>

              <div className="ingresso-dados">
                <div>
                  <div className="ingresso-rotulo">Nome</div>
                  <div>{pedido.nome}</div>
                </div>
                <div>
                  <div className="ingresso-rotulo">Ingressos</div>
                  <div>{pedido.quantidade}</div>
                </div>
                <div>
                  <div className="ingresso-rotulo">Valor</div>
                  <div>{pedido.valor_centavos === 0 ? "Grátis" : emReais(pedido.valor_centavos)}</div>
                </div>
              </div>

              <div className={"ingresso-selo selo-" + pedido.status}>
                <Icone
                  nome={pedido.status === "pago" ? "cheque" : pedido.status === "pendente" ? "alerta" : "fechar"}
                  size={16}
                />
                {pedido.status === "pago" && (pedido.checkin_em ? "Entrada já registrada" : "Pagamento confirmado")}
                {pedido.status === "pendente" && "Aguardando pagamento"}
                {pedido.status === "expirado" && "Pagamento não concluído"}
                {pedido.status === "cancelado" && "Pedido cancelado"}
              </div>

              {pedido.status === "pago" && (
                <p className="small muted" style={{ marginTop: 14, textAlign: "center" }}>
                  Mostre este código na entrada. Vale para {pedido.quantidade}{" "}
                  {pedido.quantidade === 1 ? "pessoa" : "pessoas"}.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="rodape-escuro">
          <Link href="/eventos">Ver outros eventos</Link>
        </div>

        <Rodape />
      </div>
    </div>
  );
}
