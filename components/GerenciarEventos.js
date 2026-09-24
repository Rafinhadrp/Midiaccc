"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icone from "./Icones";
import Menu from "./Menu";
import Confirmar from "./Confirmar";
import Chave from "./Chave";
import { supabaseNavegador } from "@/lib/supabase/cliente";

const emReais = (c) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function GerenciarEventos({ eventos, pedidosPorEvento, resumo }) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [aberto, setAberto] = useState(null);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState(null);

  async function salvar(dados, id) {
    const supabase = supabaseNavegador();

    const campos = {
      nome: dados.nome.trim(),
      descricao: dados.descricao?.trim() || null,
      preco_centavos: Math.round(Number(String(dados.preco).replace(",", ".")) * 100) || 0,
      data_evento: dados.data || null,
      hora: dados.hora || null,
      local: dados.local?.trim() || null,
      limite_vagas: dados.limite ? Number(dados.limite) : null,
    };

    const { error } = id
      ? await supabase.from("eventos_pagos").update(campos).eq("id", id)
      : await supabase.from("eventos_pagos").insert(campos);

    if (error) return { erro: error.message };

    setCriando(false);
    setEditando(null);
    router.refresh();
    return {};
  }

  async function alternarVendas(ev, abertas) {
    const { error } = await supabaseNavegador()
      .from("eventos_pagos").update({ vendas_abertas: abertas }).eq("id", ev.id);
    if (error) setErro(error.message);
    else router.refresh();
  }

  async function apagar(ev) {
    const { error } = await supabaseNavegador().from("eventos_pagos").delete().eq("id", ev.id);
    if (error) return { erro: error.message };
    setExcluindo(null);
    router.refresh();
    return {};
  }

  async function confirmarNaMao(pedido) {
    const { error } = await supabaseNavegador()
      .from("pedidos")
      .update({ status: "pago", pago_em: new Date().toISOString() })
      .eq("id", pedido.id);
    if (error) setErro(error.message);
    else router.refresh();
  }

  return (
    <>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      {/* ---- resumo do caixa ---- */}
      <div className="stats">
        <div className="card stat">
          <div className="n">{emReais(resumo.totalCentavos)}</div>
          <div className="l">Arrecadado</div>
        </div>
        <div className="card stat">
          <div className="n">{resumo.ingressosPagos}</div>
          <div className="l">Ingressos pagos</div>
        </div>
        <div className="card stat">
          <div className="n">{resumo.pendentes}</div>
          <div className="l">Aguardando pagamento</div>
        </div>
        <div className="card stat">
          <div className="n">{resumo.presentes}</div>
          <div className="l">Já entraram</div>
        </div>
      </div>

      <div className="aviso" style={{ background: "var(--off-bg)", color: "var(--muted)", marginTop: 16 }}>
        Confira este total com o extrato do Mercado Pago depois de cada evento. Se os
        números não baterem, algo passou por fora do sistema.
      </div>

      <button
        className="btn btn-primary btn-bloco btn-linha"
        style={{ padding: 12, marginBottom: 16 }}
        onClick={() => setCriando(true)}
      >
        <Icone nome="mais" size={16} /> Novo evento
      </button>

      {eventos.length === 0 && (
        <div className="card empty">
          <div style={{ fontWeight: 600, color: "var(--text)" }}>Nenhum evento cadastrado</div>
          <div className="small" style={{ marginTop: 6 }}>
            Crie um evento para começar a vender ingressos.
          </div>
        </div>
      )}

      {eventos.map((ev) => {
        const pedidos = pedidosPorEvento[ev.id] ?? [];
        const pagos = pedidos.filter((p) => p.status === "pago");
        const arrecadado = pagos.reduce((s, p) => s + p.valor_centavos, 0);
        const vendidos = pagos.reduce((s, p) => s + p.quantidade, 0);

        const lista = pedidos.filter((p) => {
          const alvo = `${p.nome} ${p.codigo} ${p.telefone} ${p.email}`.toLowerCase();
          return alvo.includes(busca.toLowerCase());
        });

        return (
          <div className="card block" key={ev.id} style={{ marginTop: 14 }}>
            <div className="ev-head">
              <div className="ev-date">
                <div className="d">{ev.data_evento ? ev.data_evento.slice(8, 10) : "—"}</div>
                <div className="w">{ev.data_evento ? diaCurto(ev.data_evento) : ""}</div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 16.5 }}>{ev.nome}</h3>
                <div className="small muted" style={{ marginTop: 2 }}>
                  {ev.preco_centavos === 0 ? "Grátis" : emReais(ev.preco_centavos)}
                  {ev.hora ? ` · ${ev.hora.slice(0, 5)}` : ""}
                  {ev.local ? ` · ${ev.local}` : ""}
                </div>
                <div className="small" style={{ marginTop: 6 }}>
                  <strong>{vendidos}</strong>
                  {ev.limite_vagas ? ` de ${ev.limite_vagas}` : ""} vendidos ·{" "}
                  <strong>{emReais(arrecadado)}</strong>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <Chave
                  ligada={ev.vendas_abertas}
                  onChange={(v) => alternarVendas(ev, v)}
                  rotulo="Abrir ou fechar as vendas"
                />
                <Menu
                  rotulo={`Opções de ${ev.nome}`}
                  itens={[
                    {
                      nome: aberto === ev.id ? "Fechar pedidos" : `Ver pedidos (${pedidos.length})`,
                      icone: "busca",
                      onClick: () => setAberto(aberto === ev.id ? null : ev.id),
                    },
                    { nome: "Editar evento", icone: "editar", onClick: () => setEditando(ev) },
                    { separador: true },
                    { nome: "Excluir evento", icone: "lixeira", perigo: true, onClick: () => setExcluindo(ev) },
                  ]}
                />
              </div>
            </div>

            {ev.descricao && (
              <div className="obs-lida" style={{ background: "var(--off-bg)", color: "var(--muted)" }}>
                <Icone nome="alerta" size={15} />
                <div>{ev.descricao}</div>
              </div>
            )}

            {aberto === ev.id && (
              <>
                <div style={{ padding: "14px 20px 0" }}>
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por nome, código ou telefone"
                    style={{
                      width: "100%", padding: "10px 14px",
                      border: "1px solid var(--line)", borderRadius: 10, background: "#fff",
                    }}
                  />
                </div>

                {lista.length === 0 && <div className="vazio-linha">Nenhum pedido.</div>}

                {lista.map((p) => (
                  <div className="item" key={p.id}>
                    <div className="linha-acao" style={{ alignItems: "flex-start" }}>
                      <div className="cresce">
                        <div className="item-name">
                          {p.nome}
                          {p.quantidade > 1 && (
                            <span className="small muted" style={{ fontWeight: 500 }}>
                              {" "}· {p.quantidade} ingressos
                            </span>
                          )}
                        </div>
                        <div className="item-meta">
                          <code>{p.codigo}</code> · {p.telefone} · {emReais(p.valor_centavos)}
                        </div>
                        {p.checkin_em && (
                          <div className="small" style={{ color: "var(--go)", marginTop: 4 }}>
                            entrou às{" "}
                            {new Date(p.checkin_em).toLocaleTimeString("pt-BR", {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span className={"pill pill-" + corDoStatus(p.status)}>
                          <span className="dot" />{p.status}
                        </span>

                        <Menu
                          rotulo={`Opções do pedido de ${p.nome}`}
                          itens={[
                            {
                              nome: "Abrir conferência",
                              icone: "busca",
                              onClick: () => router.push(`/painel/checkin/${p.codigo}`),
                            },
                            p.status === "pendente" && {
                              nome: "Confirmar pagamento à mão",
                              icone: "cheque",
                              onClick: () => confirmarNaMao(p),
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })}

      <Link className="btn btn-bloco" href="/eventos" style={{ marginTop: 20, textAlign: "center" }}>
        Ver a página pública
      </Link>

      {(criando || editando) && (
        <ModalEvento
          evento={editando}
          onCancelar={() => { setCriando(false); setEditando(null); }}
          onSalvar={(dados) => salvar(dados, editando?.id)}
        />
      )}

      {excluindo && (
        <Confirmar
          titulo={`Excluir ${excluindo.nome}`}
          descricao="O evento e todos os pedidos dele são apagados, inclusive os pagos. O dinheiro já recebido continua no Mercado Pago, mas o registro some daqui."
          digitar={excluindo.nome}
          rotuloBotao="Excluir evento"
          onCancelar={() => setExcluindo(null)}
          onConfirmar={() => apagar(excluindo)}
        />
      )}
    </>
  );
}

function ModalEvento({ evento, onCancelar, onSalvar }) {
  const [d, setD] = useState({
    nome: evento?.nome ?? "",
    descricao: evento?.descricao ?? "",
    preco: evento ? (evento.preco_centavos / 100).toFixed(2).replace(".", ",") : "",
    data: evento?.data_evento ?? "",
    hora: evento?.hora?.slice(0, 5) ?? "19:00",
    local: evento?.local ?? "",
    limite: evento?.limite_vagas ?? "",
  });
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);

  async function salvar() {
    setOcupado(true);
    setErro(null);
    const r = await onSalvar(d);
    if (r?.erro) { setErro(r.erro); setOcupado(false); }
  }

  return (
    <div className="overlay" onClick={onCancelar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3 style={{ fontSize: 18 }}>{evento ? "Editar evento" : "Novo evento"}</h3>
            <div className="small muted">Aparece na página pública de eventos.</div>
          </div>
        </div>

        <div className="modal-body">
          {erro && <div className="aviso aviso-erro">{erro}</div>}

          <label className="field">
            <span>Nome</span>
            <input
              value={d.nome}
              onChange={(e) => setD({ ...d, nome: e.target.value })}
              placeholder="Ex: Noite de louvor e pizza"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Descrição</span>
            <textarea
              value={d.descricao}
              onChange={(e) => setD({ ...d, descricao: e.target.value })}
              placeholder="O valor cobre a comida e o material. Leve seu caderno."
            />
          </label>

          <div style={{ display: "flex", gap: 12 }}>
            <label className="field" style={{ flex: 1 }}>
              <span>Preço por pessoa</span>
              <input
                value={d.preco}
                onChange={(e) => setD({ ...d, preco: e.target.value.replace(/[^\d,.]/g, "") })}
                placeholder="15,00"
                inputMode="decimal"
              />
              <span className="small muted" style={{ fontWeight: 400, marginTop: 6, display: "block" }}>
                Deixe 0 para evento gratuito.
              </span>
            </label>

            <label className="field" style={{ width: 130 }}>
              <span>Vagas</span>
              <input
                value={d.limite}
                onChange={(e) => setD({ ...d, limite: e.target.value.replace(/\D/g, "") })}
                placeholder="sem limite"
                inputMode="numeric"
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <label className="field" style={{ flex: 1 }}>
              <span>Data</span>
              <input type="date" value={d.data} onChange={(e) => setD({ ...d, data: e.target.value })} />
            </label>
            <label className="field" style={{ width: 130 }}>
              <span>Horário</span>
              <input type="time" value={d.hora} onChange={(e) => setD({ ...d, hora: e.target.value })} />
            </label>
          </div>

          <label className="field">
            <span>Local</span>
            <input
              value={d.local}
              onChange={(e) => setD({ ...d, local: e.target.value })}
              placeholder="Salão da igreja"
            />
          </label>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onCancelar} disabled={ocupado}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={!d.nome.trim() || ocupado}>
            {ocupado ? "Salvando..." : evento ? "Salvar" : "Criar evento"}
          </button>
        </div>
      </div>
    </div>
  );
}

function corDoStatus(s) {
  if (s === "pago") return "go";
  if (s === "pendente") return "wait";
  return "off";
}

function diaCurto(iso) {
  return ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][new Date(iso + "T12:00:00").getDay()];
}
