"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import Icone from "./Icones";
import Menu from "./Menu";
import Confirmar from "./Confirmar";
import { supabaseNavegador } from "@/lib/supabase/cliente";

/* ============================================================
   Escalas
   Cada culto é um rascunho editável: você monta tudo na tela e
   salva de uma vez. Nada vai para o banco antes do Salvar.
   ============================================================ */

export default function EditorEscalas({ eventosIniciais, funcoes, membros, podeEditar, meuId }) {
  const router = useRouter();
  const [eventos, setEventos] = useState(() => eventosIniciais.map(paraRascunho));
  const [novo, setNovo] = useState(null);
  const [erro, setErro] = useState(null);
  const [excluindo, setExcluindo] = useState(null);

  function novoCulto() {
    setNovo({
      id: null,
      titulo: "Culto de celebração",
      dia: "",
      mes: "",
      hora: "19:00",
      observacao: "",
      escala: {},
      editando: true,
    });
  }

  /** Grava o culto e as escalações de uma vez só. */
  async function salvar(rascunho, ehNovo) {
    const supabase = supabaseNavegador();
    setErro(null);

    const data = montarData(rascunho.dia, rascunho.mes);
    if (!data) return { erro: "Informe dia e mês." };

    const campos = {
      titulo: rascunho.titulo.trim() || "Culto",
      data,
      hora: rascunho.hora,
      observacao: rascunho.observacao?.trim() || null,
    };

    let eventoId = rascunho.id;

    if (ehNovo) {
      const { data: criado, error } = await supabase
        .from("eventos").insert(campos).select("id").single();
      if (error) return { erro: "Não deu para criar: " + error.message };
      eventoId = criado.id;
    } else {
      const { error } = await supabase.from("eventos").update(campos).eq("id", eventoId);
      if (error) return { erro: "Não deu para salvar: " + error.message };
    }

    // Escalações: grava quem foi escolhido, apaga quem foi esvaziado
    const preencher = [];
    const esvaziar = [];

    funcoes.forEach((f) => {
      const perfilId = rascunho.escala[f.id];
      if (perfilId) {
        preencher.push({
          evento_id: eventoId,
          funcao_id: f.id,
          perfil_id: perfilId,
          status: rascunho.statusOriginal?.[f.id] && rascunho.original?.[f.id] === perfilId
            ? rascunho.statusOriginal[f.id]
            : "aguardando",
        });
      } else {
        esvaziar.push(f.id);
      }
    });

    if (preencher.length) {
      const { error } = await supabase
        .from("escalacoes")
        .upsert(preencher, { onConflict: "evento_id,funcao_id" });
      if (error) return { erro: "Escala não salva: " + error.message };
    }

    if (esvaziar.length && !ehNovo) {
      await supabase
        .from("escalacoes")
        .delete()
        .eq("evento_id", eventoId)
        .in("funcao_id", esvaziar);
    }

    setNovo(null);
    router.refresh();
    return {};
  }

  async function excluirCulto(ev) {
    const { error } = await supabaseNavegador().from("eventos").delete().eq("id", ev.id);
    if (error) return { erro: error.message };
    setEventos((l) => l.filter((x) => x.id !== ev.id));
    setExcluindo(null);
    router.refresh();
    return {};
  }

  /** Confirmação de presença: muda na tela na hora, grava em seguida. */
  async function confirmar(eventoId, funcaoId, escalacaoId, status) {
    const anterior = eventos;

    setEventos((lista) =>
      lista.map((ev) =>
        ev.id !== eventoId
          ? ev
          : { ...ev, statusOriginal: { ...ev.statusOriginal, [funcaoId]: status } }
      )
    );

    const { error } = await supabaseNavegador()
      .from("escalacoes").update({ status }).eq("id", escalacaoId);

    if (error) {
      setEventos(anterior);
      setErro("Não deu para confirmar: " + error.message);
    }
  }

  return (
    <>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      {podeEditar && !novo && (
        <button className="btn btn-primary btn-bloco btn-linha" style={{ padding: 12, marginBottom: 16 }} onClick={novoCulto}>
          <Icone nome="mais" size={16} /> Novo culto
        </button>
      )}

      {novo && (
        <CartaoCulto
          rascunho={novo}
          funcoes={funcoes}
          membros={membros}
          meuId={meuId}
          podeEditar
          ehNovo
          onSalvar={(r) => salvar(r, true)}
          onCancelar={() => setNovo(null)}
        />
      )}

      {eventos.length === 0 && !novo && (
        <div className="card empty">
          <div style={{ fontWeight: 600, color: "var(--text)" }}>Nenhum culto programado</div>
          <div className="small" style={{ marginTop: 6 }}>
            {podeEditar ? "Crie o próximo culto para montar a equipe." : "A liderança ainda não montou as próximas escalas."}
          </div>
        </div>
      )}

      {eventos.map((ev) => (
        <CartaoCulto
          key={ev.id}
          rascunho={ev}
          funcoes={funcoes}
          membros={membros}
          meuId={meuId}
          podeEditar={podeEditar}
          onSalvar={(r) => salvar(r, false)}
          onExcluir={() => setExcluindo(ev)}
          onConfirmar={confirmar}
        />
      ))}

      {excluindo && (
        <Confirmar
          titulo={`Excluir ${excluindo.titulo}`}
          descricao="O culto e toda a escala montada nele são apagados. Não tem como desfazer."
          rotuloBotao="Excluir culto"
          onCancelar={() => setExcluindo(null)}
          onConfirmar={() => excluirCulto(excluindo)}
        />
      )}
    </>
  );
}

/* ============================================================
   Um culto
   ============================================================ */

function CartaoCulto({
  rascunho, funcoes, membros, meuId, podeEditar, ehNovo,
  onSalvar, onCancelar, onExcluir, onConfirmar,
}) {
  const [editando, setEditando] = useState(Boolean(ehNovo));
  const [d, setD] = useState(rascunho);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  // Mantém o cartão em dia quando o servidor manda dados novos
  const idAtual = rascunho.id;
  const [idVisto, setIdVisto] = useState(idAtual);
  if (idVisto !== idAtual) { setIdVisto(idAtual); setD(rascunho); }

  const escalados = funcoes.filter((f) => d.escala[f.id]);
  const faltando = funcoes.length - escalados.length;
  const mudou = JSON.stringify(d) !== JSON.stringify(rascunho);

  async function salvar() {
    setSalvando(true);
    setErro(null);
    const r = await onSalvar(d);
    setSalvando(false);
    if (r?.erro) setErro(r.erro);
    else setEditando(false);
  }

  function cancelar() {
    if (ehNovo) return onCancelar?.();
    setD(rascunho);
    setEditando(false);
    setErro(null);
  }

  return (
    <div className="card block escala-card" style={{ marginTop: 14 }}>
      {/* ---- cabeçalho ---- */}
      <div className="ev-head">
        {editando ? (
          <div className="ev-data-edit">
            <input
              className="campo-dia"
              value={d.dia}
              onChange={(e) => setD({ ...d, dia: soNumeros(e.target.value, 2) })}
              placeholder="20"
              inputMode="numeric"
              aria-label="Dia"
            />
            <span className="barra">/</span>
            <input
              className="campo-mes"
              value={d.mes}
              onChange={(e) => setD({ ...d, mes: soNumeros(e.target.value, 2) })}
              placeholder="09"
              inputMode="numeric"
              aria-label="Mês"
            />
          </div>
        ) : (
          <div className="ev-date">
            <div className="d">{d.dia}</div>
            <div className="w">{diaDaSemana(montarData(d.dia, d.mes))}</div>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {editando ? (
            <div className="ev-topo-edit">
              <input
                value={d.titulo}
                onChange={(e) => setD({ ...d, titulo: e.target.value })}
                placeholder="Nome do culto"
                className="campo-titulo"
              />
              <input
                type="time"
                value={d.hora}
                onChange={(e) => setD({ ...d, hora: e.target.value })}
                className="campo-hora"
                aria-label="Horário"
              />
            </div>
          ) : (
            <>
              <h3 style={{ fontSize: 16.5 }}>{d.titulo}</h3>
              <div className="small muted" style={{ marginTop: 2 }}>
                {d.hora?.slice(0, 5)} · {porExtenso(montarData(d.dia, d.mes))}
              </div>
              {escalados.length > 0 && (
                <div className="av-stack" style={{ marginTop: 8 }}>
                  {escalados.slice(0, 6).map((f) => {
                    const m = membros.find((x) => x.id === d.escala[f.id]);
                    return m ? <Avatar key={f.id} nome={m.nome} foto={m.foto_url} size={26} /> : null;
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {!editando && (
            <span className={"pill pill-" + (faltando ? "wait" : "go")}>
              <span className="dot" />
              {faltando ? `${faltando} em aberto` : "completa"}
            </span>
          )}

          {podeEditar && !editando && (
            <Menu
              rotulo={`Opções de ${d.titulo}`}
              itens={[
                { nome: "Editar escala", icone: "editar", onClick: () => setEditando(true) },
                { separador: true },
                { nome: "Excluir culto", icone: "lixeira", perigo: true, onClick: onExcluir },
              ]}
            />
          )}
        </div>
      </div>

      {erro && <div style={{ padding: "0 20px" }}><div className="aviso aviso-erro">{erro}</div></div>}

      {/* ---- observação ---- */}
      {editando ? (
        <div className="obs-edit">
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Recado para a equipe</span>
            <textarea
              value={d.observacao ?? ""}
              onChange={(e) => setD({ ...d, observacao: e.target.value })}
              placeholder="Ex: chegar 40 minutos antes, teremos ensaio da banda. Levar o cartão SD extra."
              style={{ minHeight: 70 }}
            />
          </label>
        </div>
      ) : d.observacao ? (
        <div className="obs-lida">
          <Icone nome="alerta" size={15} />
          <div>{d.observacao}</div>
        </div>
      ) : null}

      {/* ---- funções ---- */}
      {funcoes.map((f) => {
        const perfilId = d.escala[f.id];
        const pessoa = membros.find((m) => m.id === perfilId);
        const aptos = membros.filter((m) => m.funcoes.includes(f.id));
        const status = d.statusOriginal?.[f.id];
        const escalacaoId = d.escalacaoIds?.[f.id];
        const souEu = perfilId === meuId;

        return (
          <div className="assign" key={f.id}>
            <div className="fn">
              <span className="fn-ico" style={{ color: f.cor }}>
                <Icone nome={f.icone} size={16} />
              </span>
              {f.nome}
            </div>

            {pessoa && !editando && <Avatar nome={pessoa.nome} foto={pessoa.foto_url} size={28} />}

            {editando ? (
              <select
                value={perfilId ?? ""}
                onChange={(e) =>
                  setD({ ...d, escala: { ...d.escala, [f.id]: e.target.value || undefined } })
                }
              >
                <option value="">Ninguém escalado</option>
                {aptos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                {aptos.length === 0 && <option disabled>ninguém apto a essa função</option>}
              </select>
            ) : (
              <div style={{ flex: 1, minWidth: 0 }}>
                {pessoa?.nome ?? <span className="muted">ninguém escalado</span>}
              </div>
            )}

            {!editando && (
              souEu && status === "aguardando" ? (
                <button
                  className="btn btn-sm btn-go"
                  onClick={() => onConfirmar?.(d.id, f.id, escalacaoId, "confirmado")}
                >
                  Confirmar
                </button>
              ) : (
                <span className={"pill st pill-" + (!perfilId ? "off" : status === "confirmado" ? "go" : "wait")}>
                  <span className="dot" />
                  {!perfilId ? "vago" : status === "confirmado" ? "confirmou" : "aguardando"}
                </span>
              )
            )}
          </div>
        );
      })}

      {/* ---- rodapé de edição ---- */}
      {editando && (
        <div className="escala-rodape">
          <button className="btn" onClick={cancelar} disabled={salvando}>
            {ehNovo ? "Descartar" : "Cancelar"}
          </button>
          <button
            className="btn btn-primary btn-linha"
            onClick={salvar}
            disabled={salvando || (!ehNovo && !mudou) || !d.dia || !d.mes}
          >
            <Icone nome="cheque" size={15} />
            {salvando ? "Salvando..." : ehNovo ? "Criar culto" : "Salvar alterações"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Conversões
   ============================================================ */

/** Transforma o que veio do banco num rascunho editável. */
function paraRascunho(ev) {
  const escala = {};
  const statusOriginal = {};
  const escalacaoIds = {};

  (ev.escalacoes ?? []).forEach((e) => {
    if (e.perfil_id) escala[e.funcao_id] = e.perfil_id;
    statusOriginal[e.funcao_id] = e.status;
    escalacaoIds[e.funcao_id] = e.id;
  });

  return {
    id: ev.id,
    titulo: ev.titulo,
    dia: ev.data.slice(8, 10),
    mes: ev.data.slice(5, 7),
    hora: ev.hora?.slice(0, 5) ?? "18:30",
    observacao: ev.observacao ?? "",
    escala,
    original: { ...escala },
    statusOriginal,
    escalacaoIds,
  };
}

/**
 * Monta a data a partir de dia e mês. O ano é deduzido: se a data
 * já passou neste ano, assume o ano que vem. Assim ninguém precisa
 * digitar 2026 para marcar o culto de domingo.
 */
function montarData(dia, mes) {
  const d = Number(dia), m = Number(mes);
  if (!d || !m || d < 1 || d > 31 || m < 1 || m > 12) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let ano = hoje.getFullYear();
  const tentativa = new Date(ano, m - 1, d);
  // margem de um dia, para o culto de hoje continuar valendo
  if (tentativa < new Date(hoje.getTime() - 86400000)) ano++;

  return `${ano}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function soNumeros(v, max) {
  return v.replace(/\D/g, "").slice(0, max);
}

function diaDaSemana(iso) {
  if (!iso) return "";
  return ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][new Date(iso + "T12:00:00").getDay()];
}

function porExtenso(iso) {
  if (!iso) return "";
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });
}
