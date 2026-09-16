"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icone from "./Icones";
import Menu from "./Menu";
import Confirmar from "./Confirmar";
import { supabaseNavegador } from "@/lib/supabase/cliente";

/** Mural de avisos do painel. */
export default function Avisos({ avisosIniciais, podeGerenciar, meuId }) {
  const router = useRouter();
  const [avisos, setAvisos] = useState(avisosIniciais);
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [erro, setErro] = useState(null);

  async function salvar(dados, id) {
    const supabase = supabaseNavegador();

    const campos = {
      titulo: dados.titulo.trim(),
      texto: dados.texto?.trim() || null,
      fixado: dados.fixado,
      expira_em: dados.expira_em || null,
    };

    if (id) {
      const { error } = await supabase.from("avisos").update(campos).eq("id", id);
      if (error) return { erro: error.message };
    } else {
      const { error } = await supabase.from("avisos").insert({ ...campos, criado_por: meuId });
      if (error) return { erro: error.message };
    }

    setCriando(false);
    setEditando(null);
    router.refresh();
    return {};
  }

  async function apagar(a) {
    const { error } = await supabaseNavegador().from("avisos").delete().eq("id", a.id);
    if (error) return { erro: error.message };
    setAvisos((l) => l.filter((x) => x.id !== a.id));
    setExcluindo(null);
    router.refresh();
    return {};
  }

  async function alternarFixado(a) {
    const anterior = avisos;
    setAvisos((l) => l.map((x) => (x.id === a.id ? { ...x, fixado: !x.fixado } : x)));

    const { error } = await supabaseNavegador()
      .from("avisos").update({ fixado: !a.fixado }).eq("id", a.id);

    if (error) { setAvisos(anterior); setErro(error.message); }
    else router.refresh();
  }

  if (!avisos.length && !podeGerenciar) return null;

  return (
    <>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      <div className="card block">
        <div className="block-head">
          <div>
            <h3>Avisos</h3>
            <div className="sub">Recados para toda a equipe</div>
          </div>
          {podeGerenciar && (
            <button className="btn btn-sm btn-linha" onClick={() => setCriando(true)}>
              <Icone nome="mais" size={15} /> Novo aviso
            </button>
          )}
        </div>

        {avisos.length === 0 && (
          <div className="vazio-linha">Nenhum aviso publicado.</div>
        )}

        {avisos.map((a) => (
          <div className="item" key={a.id}>
            <div className="linha-acao" style={{ alignItems: "flex-start" }}>
              <div
                style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0, marginTop: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: a.fixado ? "var(--wait-bg)" : "var(--off-bg)",
                  color: a.fixado ? "var(--wait)" : "var(--muted)",
                }}
              >
                <Icone nome="alerta" size={17} />
              </div>

              <div className="cresce">
                <div className="item-name">
                  {a.titulo}
                  {a.fixado && <span className="pill pill-wait" style={{ marginLeft: 8, padding: "2px 8px", fontSize: 11 }}>fixado</span>}
                </div>
                {a.texto && (
                  <div className="small" style={{ marginTop: 5, whiteSpace: "pre-wrap" }}>{a.texto}</div>
                )}
                <div className="item-meta" style={{ marginTop: 6 }}>
                  {new Date(a.criado_em).toLocaleDateString("pt-BR")}
                  {a.expira_em && ` · some em ${new Date(a.expira_em + "T12:00:00").toLocaleDateString("pt-BR")}`}
                </div>
              </div>

              {podeGerenciar && (
                <Menu
                  rotulo={`Opções do aviso ${a.titulo}`}
                  itens={[
                    { nome: a.fixado ? "Desafixar" : "Fixar no topo", icone: "alerta", onClick: () => alternarFixado(a) },
                    { nome: "Editar", icone: "editar", onClick: () => setEditando(a) },
                    { separador: true },
                    { nome: "Excluir aviso", icone: "lixeira", perigo: true, onClick: () => setExcluindo(a) },
                  ]}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {(criando || editando) && (
        <ModalAviso
          aviso={editando}
          onCancelar={() => { setCriando(false); setEditando(null); }}
          onSalvar={(dados) => salvar(dados, editando?.id)}
        />
      )}

      {excluindo && (
        <Confirmar
          titulo="Excluir aviso"
          descricao={`"${excluindo.titulo}" some do painel de todo mundo.`}
          rotuloBotao="Excluir"
          onCancelar={() => setExcluindo(null)}
          onConfirmar={() => apagar(excluindo)}
        />
      )}
    </>
  );
}

function ModalAviso({ aviso, onCancelar, onSalvar }) {
  const [titulo, setTitulo] = useState(aviso?.titulo ?? "");
  const [texto, setTexto] = useState(aviso?.texto ?? "");
  const [fixado, setFixado] = useState(aviso?.fixado ?? false);
  const [expira, setExpira] = useState(aviso?.expira_em ?? "");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);

  async function salvar() {
    setOcupado(true);
    setErro(null);
    const r = await onSalvar({ titulo, texto, fixado, expira_em: expira });
    if (r?.erro) { setErro(r.erro); setOcupado(false); }
  }

  return (
    <div className="overlay" onClick={onCancelar}>
      <div className="modal confirma" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="confirma-ico" style={{ background: "var(--wait-bg)", color: "var(--wait)" }}>
            <Icone nome="alerta" size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 17 }}>{aviso ? "Editar aviso" : "Novo aviso"}</h3>
            <div className="small muted">Todo mundo da equipe vê no painel.</div>
          </div>
        </div>

        <div className="modal-body">
          {erro && <div className="aviso aviso-erro">{erro}</div>}

          <label className="field">
            <span>Título</span>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reunião da equipe no sábado"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Detalhes</span>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Sábado, 15h, na sala de mídia. Vamos treinar a nova mesa de som e revisar a escala do mês."
            />
          </label>

          <label className="field">
            <span>Sumir automaticamente em</span>
            <input type="date" value={expira} onChange={(e) => setExpira(e.target.value)} />
            <span className="small muted" style={{ fontWeight: 400, marginTop: 6, display: "block" }}>
              Opcional. Deixe vazio para o aviso ficar até você apagar.
            </span>
          </label>

          <label className="linha-acao" style={{ cursor: "pointer", marginBottom: 4 }}>
            <input
              type="checkbox"
              checked={fixado}
              onChange={(e) => setFixado(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--ink)" }}
            />
            <div className="cresce">
              <div style={{ fontSize: 14, fontWeight: 600 }}>Fixar no topo</div>
              <div className="small muted">Fica acima dos outros e não expira.</div>
            </div>
          </label>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onCancelar} disabled={ocupado}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={!titulo.trim() || ocupado}>
            {ocupado ? "Salvando..." : aviso ? "Salvar" : "Publicar aviso"}
          </button>
        </div>
      </div>
    </div>
  );
}
