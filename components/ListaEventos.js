"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icone from "./Icones";

const emReais = (c) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ListaEventos({ eventos }) {
  const [comprando, setComprando] = useState(null);

  if (!eventos.length) {
    return (
      <div className="pub-card">
        <div className="fechado">
          <div className="fechado-ico">
            <img src="/logo-branca.png" alt="" />
          </div>
          <h3 style={{ fontSize: 20 }}>Nenhum evento no momento</h3>
          <p className="small muted" style={{ marginTop: 10 }}>
            Quando a igreja abrir um evento com inscrição, ele aparece aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="eventos-lista">
        {eventos.map((e) => {
          const esgotado = e.restantes !== null && e.restantes <= 0;
          const fechado = !e.vendas_abertas || esgotado;

          return (
            <div className="evento-card" key={e.id}>
              <div className="evento-topo">
                <div>
                  <h3>{e.nome}</h3>
                  {e.data_evento && (
                    <div className="evento-quando">
                      {porExtenso(e.data_evento)}
                      {e.hora ? ` · ${e.hora.slice(0, 5)}` : ""}
                    </div>
                  )}
                  {e.local && <div className="evento-local">{e.local}</div>}
                </div>
                <div className="evento-preco">
                  {e.preco_centavos === 0 ? "Grátis" : emReais(e.preco_centavos)}
                </div>
              </div>

              {e.descricao && <p className="evento-desc">{e.descricao}</p>}

              <div className="evento-rodape">
                {e.restantes !== null && !esgotado && (
                  <span className="small muted">
                    {e.restantes} {e.restantes === 1 ? "vaga restante" : "vagas restantes"}
                  </span>
                )}
                {esgotado && <span className="pill pill-off"><span className="dot" />esgotado</span>}
                {!e.vendas_abertas && !esgotado && (
                  <span className="pill pill-off"><span className="dot" />vendas fechadas</span>
                )}

                <button
                  className="btn btn-primary"
                  style={{ marginLeft: "auto" }}
                  disabled={fechado}
                  onClick={() => setComprando(e)}
                >
                  {fechado ? "Indisponível" : "Quero ir"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {comprando && <ModalCompra evento={comprando} onFechar={() => setComprando(null)} />}
    </>
  );
}

/* ============================================================
   Compra: dados, pagamento e confirmação
   ============================================================ */

function ModalCompra({ evento, onFechar }) {
  const [etapa, setEtapa] = useState("dados"); // dados | pagar | pronto
  const [f, setF] = useState({ nome: "", email: "", telefone: "", quantidade: 1 });
  const [pix, setPix] = useState(null);
  const [codigo, setCodigo] = useState(null);
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [restante, setRestante] = useState(null);

  const digitos = f.telefone.replace(/\D/g, "");
  const valido = f.nome.trim() && f.email.trim() && digitos.length >= 10;
  const total = evento.preco_centavos * f.quantidade;

  const maximo = evento.restantes !== null ? Math.min(10, evento.restantes) : 10;

  async function comprar() {
    setErro(null);
    setOcupado(true);

    try {
      const r = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventoId: evento.id, ...f }),
      });
      const dados = await r.json();

      if (!r.ok) { setErro(dados.erro || "Não deu certo."); setOcupado(false); return; }

      if (dados.gratuito) {
        setCodigo(dados.codigo);
        setEtapa("pronto");
      } else {
        setPix(dados);
        setEtapa("pagar");
      }
    } catch {
      setErro("Sem conexão. Tente de novo.");
    }
    setOcupado(false);
  }

  return (
    <div className="overlay" onClick={etapa === "pagar" ? undefined : onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3 style={{ fontSize: 18 }}>{evento.nome}</h3>
            <div className="small muted">
              {etapa === "dados" && "Seus dados"}
              {etapa === "pagar" && "Pague com Pix para confirmar"}
              {etapa === "pronto" && "Tudo certo"}
            </div>
          </div>
        </div>

        <div className="modal-body">
          {erro && <div className="aviso aviso-erro">{erro}</div>}

          {etapa === "dados" && (
            <>
              <label className="field">
                <span>Nome completo</span>
                <input
                  value={f.nome}
                  onChange={(e) => setF({ ...f, nome: e.target.value })}
                  autoFocus
                />
              </label>

              <label className="field">
                <span>E-mail</span>
                <input
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                  inputMode="email"
                  placeholder="voce@email.com"
                />
              </label>

              <label className="field">
                <span>WhatsApp</span>
                <input
                  value={f.telefone}
                  onChange={(e) => setF({ ...f, telefone: e.target.value })}
                  inputMode="tel"
                  placeholder="(11) 99999-0000"
                />
              </label>

              <label className="field">
                <span>Quantos ingressos</span>
                <select
                  value={f.quantidade}
                  onChange={(e) => setF({ ...f, quantidade: Number(e.target.value) })}
                >
                  {Array.from({ length: maximo }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>

              <div className="total-linha">
                <span>Total</span>
                <strong>{total === 0 ? "Grátis" : emReais(total)}</strong>
              </div>
            </>
          )}

          {etapa === "pagar" && (
            <PainelPix
              pix={pix}
              total={total}
              copiado={copiado}
              setCopiado={setCopiado}
              restante={restante}
              setRestante={setRestante}
              onPago={(cod) => { setCodigo(cod); setEtapa("pronto"); }}
              onExpirou={() => {
                setErro("O prazo para pagar expirou. Comece de novo.");
                setEtapa("dados");
                setPix(null);
              }}
            />
          )}

          {etapa === "pronto" && (
            <div className="done" style={{ padding: "8px 0" }}>
              <div className="mark"><Icone nome="cheque" size={24} strokeWidth={2.2} /></div>
              <h3 style={{ fontSize: 20 }}>Ingresso confirmado</h3>
              <p className="small muted" style={{ marginTop: 10 }}>
                Guarde este código. É ele que vale na entrada.
              </p>
              <div className="codigo-grande">{codigo}</div>
              <Link className="btn btn-bloco" href={`/ingresso/${codigo}`}>
                Ver meu ingresso
              </Link>
            </div>
          )}
        </div>

        <div className="modal-foot">
          {etapa === "dados" && (
            <>
              <button className="btn" onClick={onFechar} disabled={ocupado}>Cancelar</button>
              <button className="btn btn-primary" onClick={comprar} disabled={!valido || ocupado}>
                {ocupado ? "Gerando Pix..." : total === 0 ? "Confirmar" : "Ir para o pagamento"}
              </button>
            </>
          )}
          {etapa === "pagar" && (
            <button className="btn" onClick={onFechar}>Pagar depois</button>
          )}
          {etapa === "pronto" && (
            <button className="btn btn-primary" onClick={onFechar}>Fechar</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Tela do Pix, com consulta automática
   ============================================================ */

function PainelPix({ pix, total, copiado, setCopiado, restante, setRestante, onPago, onExpirou }) {
  const timerRef = useRef(null);

  // Consulta o pedido a cada 4 segundos até confirmar
  useEffect(() => {
    let vivo = true;

    async function checar() {
      try {
        const r = await fetch(`/api/pedidos/${pix.pedidoId}/status`, { cache: "no-store" });
        const dados = await r.json();
        if (!vivo) return;

        if (dados.status === "pago") onPago(dados.codigo ?? pix.codigo);
        else if (dados.status === "expirado") onExpirou();
      } catch {
        // rede oscilou: tenta de novo no próximo ciclo
      }
    }

    timerRef.current = setInterval(checar, 4000);
    checar();

    return () => { vivo = false; clearInterval(timerRef.current); };
  }, [pix.pedidoId]);

  // Contagem regressiva
  useEffect(() => {
    function atualizar() {
      const faltam = Math.max(0, new Date(pix.expiraEm).getTime() - Date.now());
      setRestante(Math.floor(faltam / 1000));
    }
    atualizar();
    const t = setInterval(atualizar, 1000);
    return () => clearInterval(t);
  }, [pix.expiraEm, setRestante]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pix.copiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // alguns navegadores bloqueiam: o texto fica visível para copiar à mão
    }
  }

  const minutos = restante !== null ? Math.floor(restante / 60) : null;
  const segundos = restante !== null ? String(restante % 60).padStart(2, "0") : null;

  return (
    <div className="pix-painel">
      <div className="pix-valor">{emReais(total)}</div>

      {pix.qrBase64 && (
        <img
          className="pix-qr"
          src={`data:image/png;base64,${pix.qrBase64}`}
          alt="QR code do Pix"
        />
      )}

      <div className="small muted" style={{ textAlign: "center", marginBottom: 14 }}>
        Abra o aplicativo do seu banco, escolha Pix e leia o código.
      </div>

      <button className="btn btn-bloco btn-linha" onClick={copiar}>
        <Icone nome={copiado ? "cheque" : "editar"} size={15} />
        {copiado ? "Código copiado" : "Copiar código Pix"}
      </button>

      <div className="pix-codigo">{pix.copiaECola}</div>

      <div className="pix-espera">
        <span className="girando" aria-hidden="true" />
        Aguardando o pagamento
        {restante !== null && restante > 0 && (
          <span className="muted"> · expira em {minutos}:{segundos}</span>
        )}
      </div>

      <div className="small muted" style={{ textAlign: "center", marginTop: 10 }}>
        A confirmação é automática. Não feche esta tela.
      </div>
    </div>
  );
}

function porExtenso(iso) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });
}
