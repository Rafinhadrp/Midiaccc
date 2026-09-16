"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import Icone from "./Icones";
import { supabaseNavegador } from "@/lib/supabase/cliente";

export default function EditorEscalas({ eventosIniciais, funcoes, membros, podeEditar, meuId }) {
  const router = useRouter();
  const [eventos, setEventos] = useState(eventosIniciais);
  const [erro, setErro] = useState(null);
  const [novo, setNovo] = useState(false);

  async function escalar(eventoId, funcaoId, perfilId) {
    const supabase = supabaseNavegador();
    setErro(null);

    const anterior = eventos;
    setEventos((lista) =>
      lista.map((ev) =>
        ev.id !== eventoId ? ev : { ...ev, escalacoes: trocar(ev.escalacoes, funcaoId, perfilId) }
      )
    );

    const { error } = await supabase
      .from("escalacoes")
      .upsert(
        { evento_id: eventoId, funcao_id: funcaoId, perfil_id: perfilId || null, status: "aguardando" },
        { onConflict: "evento_id,funcao_id" }
      );

    if (error) {
      setEventos(anterior);
      setErro("Não deu para salvar: " + error.message);
    }
  }

  async function confirmarPresenca(escalacaoId, status) {
    const { error } = await supabaseNavegador()
      .from("escalacoes").update({ status }).eq("id", escalacaoId);
    if (error) setErro(error.message);
    else router.refresh();
  }

  async function criarEvento(dados) {
    const { error } = await supabaseNavegador().from("eventos").insert(dados);
    if (error) setErro(error.message);
    else { setNovo(false); router.refresh(); }
  }

  return (
    <>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      {eventos.length === 0 && !novo && (
        <div className="card empty">
          <div style={{ fontWeight: 600, color: "var(--text)" }}>Nenhum culto programado</div>
          <div className="small" style={{ marginTop: 6 }}>
            Cadastre o próximo culto para montar a equipe.
          </div>
        </div>
      )}

      {eventos.map((ev) => {
        const preenchidas = funcoes.filter((f) => achar(ev.escalacoes, f.id)?.perfil_id);
        const faltando = funcoes.length - preenchidas.length;

        return (
          <div className="card block" key={ev.id} style={{ marginTop: 14 }}>
            <div className="ev-head">
              <div className="ev-date">
                <div className="d">{ev.data.slice(8, 10)}</div>
                <div className="w">{diaCurto(ev.data)}</div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 16.5 }}>{ev.titulo}</h3>
                <div className="small muted" style={{ marginTop: 2 }}>
                  {ev.hora.slice(0, 5)}, {new Date(ev.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
                </div>
                <div className="av-stack" style={{ marginTop: 8 }}>
                  {preenchidas.slice(0, 5).map((f) => {
                    const m = membros.find((x) => x.id === achar(ev.escalacoes, f.id)?.perfil_id);
                    return m ? <Avatar key={f.id} nome={m.nome} foto={m.foto_url} size={26} /> : null;
                  })}
                </div>
              </div>

              <span className={"pill pill-" + (faltando ? "wait" : "go")}>
                <span className="dot" />
                {faltando ? `${faltando} em aberto` : "completa"}
              </span>
            </div>

            {funcoes.map((f) => {
              const esc = achar(ev.escalacoes, f.id);
              const pessoa = membros.find((m) => m.id === esc?.perfil_id);
              const aptos = membros.filter((m) => m.funcoes.includes(f.id));
              const souEu = esc?.perfil_id === meuId;

              return (
                <div className="assign" key={f.id}>
                  <div className="fn">
                    <span className="fn-ico" style={{ color: f.cor }}>
                      <Icone nome={f.icone} size={16} />
                    </span>
                    {f.nome}
                  </div>

                  {pessoa && <Avatar nome={pessoa.nome} foto={pessoa.foto_url} size={28} />}

                  {podeEditar ? (
                    <select
                      value={esc?.perfil_id ?? ""}
                      onChange={(e) => escalar(ev.id, f.id, e.target.value)}
                    >
                      <option value="">Ninguém escalado</option>
                      {aptos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                    </select>
                  ) : (
                    <div style={{ flex: 1 }}>
                      {pessoa?.nome ?? <span className="muted">ninguém escalado</span>}
                    </div>
                  )}

                  {souEu && esc?.status === "aguardando" ? (
                    <button className="btn btn-sm btn-go" onClick={() => confirmarPresenca(esc.id, "confirmado")}>
                      Confirmar
                    </button>
                  ) : (
                    <span className={"pill st pill-" + (!esc?.perfil_id ? "off" : esc.status === "confirmado" ? "go" : "wait")}>
                      <span className="dot" />
                      {!esc?.perfil_id ? "vago" : esc.status === "confirmado" ? "confirmou" : "aguardando"}
                    </span>
                  )}
                </div>
              );
            })}

            {aptosFaltando(funcoes, membros).length > 0 && podeEditar && (
              <div className="vazio-linha" style={{ textAlign: "left", paddingTop: 14 }}>
                Sem ninguém apto para: {aptosFaltando(funcoes, membros).map((f) => f.nome).join(", ")}.
                Defina as funções da equipe em Membros.
              </div>
            )}
          </div>
        );
      })}

      {podeEditar && (novo ? (
        <FormEvento onSalvar={criarEvento} onCancelar={() => setNovo(false)} />
      ) : (
        <button
          className="btn btn-primary btn-bloco btn-linha"
          style={{ marginTop: 16, padding: 13 }}
          onClick={() => setNovo(true)}
        >
          <Icone nome="mais" size={16} /> Adicionar culto
        </button>
      ))}
    </>
  );
}

function FormEvento({ onSalvar, onCancelar }) {
  const [titulo, setTitulo] = useState("Culto de celebração");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("18:30");

  return (
    <div className="card" style={{ padding: 20, marginTop: 16 }}>
      <h3 style={{ fontSize: 16.5, marginBottom: 16 }}>Novo culto</h3>

      <label className="field">
        <span>Nome</span>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </label>

      <div style={{ display: "flex", gap: 12 }}>
        <label className="field" style={{ flex: 1 }}>
          <span>Data</span>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        <label className="field" style={{ width: 140 }}>
          <span>Horário</span>
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </label>
      </div>

      <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
        <button className="btn" onClick={onCancelar}>Cancelar</button>
        <button className="btn btn-primary" disabled={!data} onClick={() => onSalvar({ titulo, data, hora })}>
          Salvar culto
        </button>
      </div>
    </div>
  );
}

const achar = (lista, funcaoId) => (lista ?? []).find((e) => e.funcao_id === funcaoId);

function trocar(lista, funcaoId, perfilId) {
  const resto = (lista ?? []).filter((e) => e.funcao_id !== funcaoId);
  const antigo = achar(lista, funcaoId);
  return [
    ...resto,
    { ...(antigo ?? {}), funcao_id: funcaoId, perfil_id: perfilId || null, status: "aguardando" },
  ];
}

/** Funções para as quais ninguém do time está habilitado. */
function aptosFaltando(funcoes, membros) {
  return funcoes.filter((f) => !membros.some((m) => m.funcoes.includes(f.id)));
}

function diaCurto(iso) {
  return ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][new Date(iso + "T12:00:00").getDay()];
}
