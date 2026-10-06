"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icone from "./Icones";

/**
 * Registra a entrada assim que a tela abre.
 *
 * A gravação acontece por POST daqui, e não durante o carregamento
 * da página no servidor: abrir um endereço não deveria, por si só,
 * mudar nada no banco — um pré-carregamento do navegador marcaria
 * ingressos sozinho.
 */
export default function CheckinAutomatico({ codigo }) {
  const [estado, setEstado] = useState({ fase: "registrando" });
  const jaFoiRef = useRef(false);

  useEffect(() => {
    if (jaFoiRef.current) return;
    jaFoiRef.current = true;

    (async () => {
      try {
        const r = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigo }),
        });
        const dados = await r.json();

        if (!r.ok) {
          setEstado({ fase: "pronto", resultado: "erro", mensagem: dados.erro });
          return;
        }

        setEstado({ fase: "pronto", ...dados });

        if (navigator.vibrate) {
          if (dados.resultado === "liberado") navigator.vibrate(90);
          else if (dados.resultado === "repetido") navigator.vibrate([70, 70, 70]);
          else navigator.vibrate([200, 90, 200]);
        }
      } catch {
        setEstado({ fase: "pronto", resultado: "erro", mensagem: "Sem conexão." });
      }
    })();
  }, [codigo]);

  if (estado.fase === "registrando") {
    return (
      <div className="card" style={{ padding: 30, textAlign: "center" }}>
        <span className="girando" style={{ margin: "0 auto" }} aria-hidden="true" />
        <div className="small muted" style={{ marginTop: 14 }}>Conferindo {codigo}...</div>
      </div>
    );
  }

  const { resultado, pedido, mensagem } = estado;

  const visual = {
    liberado: { cor: "ok", icone: "cheque", titulo: "Pode entrar" },
    repetido: { cor: "aviso", icone: "alerta", titulo: "Já usado" },
    nao_pago: { cor: "ruim", icone: "fechar", titulo: "Ingresso não pago" },
    nao_existe: { cor: "ruim", icone: "fechar", titulo: "Código não existe" },
    erro: { cor: "ruim", icone: "fechar", titulo: "Deu problema" },
  }[resultado] ?? { cor: "ruim", icone: "fechar", titulo: "Desconhecido" };

  return (
    <>
      <div className={"checkin-cartao " + visual.cor}>
        <div className="checkin-ico-grande">
          <Icone nome={visual.icone} size={38} strokeWidth={2.3} />
        </div>

        <h2 style={{ fontSize: 24, marginTop: 14 }}>{visual.titulo}</h2>

        {pedido?.nome && (
          <div style={{ fontSize: 17, fontWeight: 600, marginTop: 8 }}>{pedido.nome}</div>
        )}

        <div className="codigo-grande" style={{ fontSize: 24, margin: "12px 0 4px" }}>
          {pedido?.codigo ?? codigo}
        </div>

        {pedido && (
          <div className="checkin-dados" style={{ marginTop: 14 }}>
            {pedido.evento && (
              <div><span className="muted">Evento</span><strong>{pedido.evento}</strong></div>
            )}
            <div>
              <span className="muted">Pessoas</span>
              <strong>{pedido.quantidade}</strong>
            </div>
            {pedido.checkin_em && (
              <div>
                <span className="muted">Entrada</span>
                <strong>
                  {new Date(pedido.checkin_em).toLocaleTimeString("pt-BR", {
                    hour: "2-digit", minute: "2-digit",
                  })}
                </strong>
              </div>
            )}
          </div>
        )}

        {resultado === "repetido" && (
          <p className="small muted" style={{ marginTop: 14 }}>
            Esse ingresso já tinha sido usado. Confirme com a pessoa antes de liberar.
          </p>
        )}

        {resultado === "erro" && mensagem && (
          <p className="small" style={{ marginTop: 14, color: "var(--erro)" }}>{mensagem}</p>
        )}
      </div>

      <Link className="btn btn-primary btn-bloco btn-linha" href="/painel/checkin" style={{ marginTop: 14 }}>
        <Icone nome="camera" size={16} /> Ler o próximo
      </Link>

      <Link className="btn btn-bloco" href="/painel/eventos" style={{ marginTop: 9, textAlign: "center" }}>
        Voltar aos eventos
      </Link>
    </>
  );
}
