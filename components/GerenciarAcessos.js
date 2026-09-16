"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icone, { ICONES_FUNCAO } from "./Icones";
import Menu from "./Menu";
import Confirmar from "./Confirmar";
import { supabaseNavegador } from "@/lib/supabase/cliente";

const CORES = [
  "#2E6BFF", "#FF3B2F", "#8B5CF6", "#16A46B",
  "#F79009", "#EC4899", "#0EA5E9", "#65A30D",
];

export default function GerenciarAcessos({
  papeis, permissoes, vinculosIniciais, funcoes, usoPorPapel, usoPorFuncao,
}) {
  const [aba, setAba] = useState("papeis");

  return (
    <>
      <div className="abas">
        <button className={"aba" + (aba === "papeis" ? " on" : "")} onClick={() => setAba("papeis")}>
          Papéis e permissões
        </button>
        <button className={"aba" + (aba === "funcoes" ? " on" : "")} onClick={() => setAba("funcoes")}>
          Funções do ministério
        </button>
      </div>

      {aba === "papeis" ? (
        <Papeis
          papeis={papeis}
          permissoes={permissoes}
          vinculosIniciais={vinculosIniciais}
          usoPorPapel={usoPorPapel}
        />
      ) : (
        <Funcoes funcoes={funcoes} usoPorFuncao={usoPorFuncao} />
      )}
    </>
  );
}

/* ============================================================
   Papéis
   ============================================================ */

function Papeis({ papeis, permissoes, vinculosIniciais, usoPorPapel }) {
  const router = useRouter();
  const [vinculos, setVinculos] = useState(vinculosIniciais);
  const [erro, setErro] = useState(null);
  const [criando, setCriando] = useState(false);
  const [excluindo, setExcluindo] = useState(null);

  const tem = (papel, perm) =>
    vinculos.some((v) => v.papel_id === papel && v.permissao_id === perm);

  async function alternar(papel_id, permissao_id) {
    const supabase = supabaseNavegador();
    const marcado = tem(papel_id, permissao_id);
    const anterior = vinculos;

    setVinculos(
      marcado
        ? vinculos.filter((v) => !(v.papel_id === papel_id && v.permissao_id === permissao_id))
        : [...vinculos, { papel_id, permissao_id }]
    );

    const { error } = marcado
      ? await supabase.from("papel_permissoes").delete()
          .eq("papel_id", papel_id).eq("permissao_id", permissao_id)
      : await supabase.from("papel_permissoes").insert({ papel_id, permissao_id });

    if (error) {
      setVinculos(anterior);
      setErro("Não deu para salvar: " + error.message);
    } else {
      setErro(null);
    }
  }

  async function criarPapel(nome) {
    const id = paraSlug(nome);
    if (!id) return { erro: "Escolha um nome válido." };
    if (papeis.some((p) => p.id === id)) return { erro: "Já existe um papel com esse nome." };

    const { error } = await supabaseNavegador().from("papeis").insert({ id, nome: nome.trim() });
    if (error) return { erro: error.message };
    setCriando(false);
    router.refresh();
    return {};
  }

  async function apagarPapel(p) {
    if (usoPorPapel[p.id] > 0) {
      return { erro: `${usoPorPapel[p.id]} pessoa(s) usam esse papel. Mude o papel delas antes de apagar.` };
    }
    const { error } = await supabaseNavegador().from("papeis").delete().eq("id", p.id);
    if (error) return { erro: error.message };
    setExcluindo(null);
    router.refresh();
    return {};
  }

  return (
    <>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      <div className="card block" style={{ marginTop: 0 }}>
        <div className="block-head">
          <div>
            <h3>O que cada papel pode fazer</h3>
            <div className="sub">A mudança vale na hora para todo mundo daquele papel</div>
          </div>
          <button className="btn btn-sm btn-linha" onClick={() => setCriando(true)}>
            <Icone nome="mais" size={15} /> Novo papel
          </button>
        </div>

        <div className="matrix-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th>Permissão</th>
                {papeis.map((p) => (
                  <th key={p.id}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <span>{p.nome}</span>
                      <span style={{ fontWeight: 500, fontSize: 11, color: "var(--muted)" }}>
                        {usoPorPapel[p.id] ?? 0} {usoPorPapel[p.id] === 1 ? "pessoa" : "pessoas"}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissoes.map((perm) => (
                <tr key={perm.id}>
                  <td>{perm.nome}</td>
                  {papeis.map((p) => (
                    <td key={p.id}>
                      <input
                        type="checkbox"
                        checked={tem(p.id, perm.id)}
                        onChange={() => alternar(p.id, perm.id)}
                        aria-label={`${perm.nome} para ${p.nome}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="small muted">Remover papel</td>
                {papeis.map((p) => (
                  <td key={p.id}>
                    <button
                      className="btn-ico"
                      style={{ margin: "0 auto", color: p.id === "lider" ? "var(--line)" : undefined }}
                      disabled={p.id === "lider"}
                      title={p.id === "lider" ? "O papel de líder não pode ser removido" : `Remover ${p.nome}`}
                      onClick={() => setExcluindo(p)}
                    >
                      <Icone nome="lixeira" size={15} />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card block">
        <div className="block-head">
          <div>
            <h3>Sessões</h3>
            <div className="sub">Quem entra continua conectado sem digitar a senha de novo</div>
          </div>
        </div>
        <div className="item">
          <div className="small muted">
            O tempo de expiração fica no painel do Supabase, em Authentication &gt; Sessions.
            Com o time-box em 30 dias, todo mundo entra de novo uma vez por mês.
          </div>
        </div>
      </div>

      {criando && (
        <ModalNome
          titulo="Novo papel"
          descricao="Papéis agrupam permissões. Depois de criar, marque na tabela o que ele pode fazer."
          exemplo="ex: Coordenador de transmissão"
          onCancelar={() => setCriando(false)}
          onSalvar={criarPapel}
        />
      )}

      {excluindo && (
        <Confirmar
          titulo={`Remover o papel ${excluindo.nome}`}
          descricao="As permissões desse papel são apagadas junto. Quem estiver com ele precisa ser movido antes."
          rotuloBotao="Remover papel"
          onCancelar={() => setExcluindo(null)}
          onConfirmar={() => apagarPapel(excluindo)}
        />
      )}
    </>
  );
}

/* ============================================================
   Funções do ministério
   ============================================================ */

function Funcoes({ funcoes, usoPorFuncao }) {
  const router = useRouter();
  const [erro, setErro] = useState(null);
  const [editando, setEditando] = useState(null);
  const [criando, setCriando] = useState(false);
  const [excluindo, setExcluindo] = useState(null);

  async function salvar(dados, idExistente) {
    const supabase = supabaseNavegador();

    if (idExistente) {
      const { error } = await supabase
        .from("funcoes")
        .update({ nome: dados.nome, cor: dados.cor, icone: dados.icone })
        .eq("id", idExistente);
      if (error) return { erro: error.message };
    } else {
      const id = paraSlug(dados.nome);
      if (!id) return { erro: "Escolha um nome válido." };
      if (funcoes.some((f) => f.id === id)) return { erro: "Já existe uma função com esse nome." };

      const ordem = Math.max(0, ...funcoes.map((f) => f.ordem ?? 0)) + 1;
      const { error } = await supabase
        .from("funcoes")
        .insert({ id, nome: dados.nome.trim(), cor: dados.cor, icone: dados.icone, ordem });
      if (error) return { erro: error.message };
    }

    setEditando(null);
    setCriando(false);
    router.refresh();
    return {};
  }

  async function apagar(f) {
    const { error } = await supabaseNavegador().from("funcoes").delete().eq("id", f.id);
    if (error) return { erro: error.message };
    setExcluindo(null);
    router.refresh();
    return {};
  }

  return (
    <>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      <div className="card block" style={{ marginTop: 0 }}>
        <div className="block-head">
          <div>
            <h3>Funções</h3>
            <div className="sub">O que aparece na inscrição e nas escalas</div>
          </div>
          <button className="btn btn-sm btn-linha" onClick={() => setCriando(true)}>
            <Icone nome="mais" size={15} /> Nova função
          </button>
        </div>

        {funcoes.map((f) => (
          <div className="item" key={f.id}>
            <div className="linha-acao">
              <div
                style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: f.cor + "1A", color: f.cor,
                }}
              >
                <Icone nome={f.icone} size={19} />
              </div>

              <div className="cresce">
                <div className="item-name">{f.nome}</div>
                <div className="item-meta">
                  {usoPorFuncao[f.id] ?? 0} {usoPorFuncao[f.id] === 1 ? "pessoa apta" : "pessoas aptas"}
                </div>
              </div>

              <Menu
                rotulo={`Opções de ${f.nome}`}
                itens={[
                  { nome: "Editar", icone: "editar", onClick: () => setEditando(f) },
                  { separador: true },
                  { nome: "Excluir função", icone: "lixeira", perigo: true, onClick: () => setExcluindo(f) },
                ]}
              />
            </div>
          </div>
        ))}

        {funcoes.length === 0 && (
          <div className="vazio-linha">Nenhuma função cadastrada ainda.</div>
        )}
      </div>

      {(criando || editando) && (
        <ModalFuncao
          funcao={editando}
          onCancelar={() => { setCriando(false); setEditando(null); }}
          onSalvar={(dados) => salvar(dados, editando?.id)}
        />
      )}

      {excluindo && (
        <Confirmar
          titulo={`Excluir a função ${excluindo.nome}`}
          descricao={
            (usoPorFuncao[excluindo.id] ?? 0) > 0
              ? `${usoPorFuncao[excluindo.id]} pessoa(s) têm essa função, e ela some do cadastro delas. As escalas já montadas nessa função também são apagadas.`
              : "Ela some da inscrição e das escalas. Não tem como desfazer."
          }
          digitar={excluindo.nome}
          rotuloBotao="Excluir função"
          onCancelar={() => setExcluindo(null)}
          onConfirmar={() => apagar(excluindo)}
        />
      )}
    </>
  );
}

/* ============================================================
   Modais auxiliares
   ============================================================ */

function ModalFuncao({ funcao, onCancelar, onSalvar }) {
  const [nome, setNome] = useState(funcao?.nome ?? "");
  const [cor, setCor] = useState(funcao?.cor ?? CORES[0]);
  const [icone, setIcone] = useState(funcao?.icone ?? "ponto");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);

  async function salvar() {
    setOcupado(true);
    setErro(null);
    const r = await onSalvar({ nome, cor, icone });
    if (r?.erro) { setErro(r.erro); setOcupado(false); }
  }

  return (
    <div className="overlay" onClick={onCancelar}>
      <div className="modal confirma" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div
            style={{
              width: 42, height: 42, borderRadius: 11, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: cor + "1A", color: cor,
            }}
          >
            <Icone nome={icone} size={21} />
          </div>
          <div>
            <h3 style={{ fontSize: 17 }}>{funcao ? "Editar função" : "Nova função"}</h3>
            <div className="small muted">{nome || "sem nome ainda"}</div>
          </div>
        </div>

        <div className="modal-body">
          {erro && <div className="aviso aviso-erro">{erro}</div>}

          <label className="field">
            <span>Nome</span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="ex: Iluminação"
              autoFocus
            />
          </label>

          <div className="field">
            <span>Ícone</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {ICONES_FUNCAO.map((n) => (
                <button
                  key={n}
                  className="btn-ico"
                  style={{
                    width: 40, height: 40, borderRadius: 9,
                    border: "1px solid " + (icone === n ? "var(--ink)" : "var(--line)"),
                    background: icone === n ? "var(--ink)" : "#fff",
                    color: icone === n ? "#fff" : "var(--muted)",
                  }}
                  onClick={() => setIcone(n)}
                  aria-label={`Ícone ${n}`}
                >
                  <Icone nome={n} size={18} />
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>Cor</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CORES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCor(c)}
                  aria-label={`Cor ${c}`}
                  style={{
                    width: 30, height: 30, borderRadius: 8, background: c,
                    border: cor === c ? "2px solid var(--ink)" : "1px solid var(--line)",
                    boxShadow: cor === c ? "inset 0 0 0 2px #fff" : "none",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onCancelar} disabled={ocupado}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={!nome.trim() || ocupado}>
            {ocupado ? "Salvando..." : funcao ? "Salvar" : "Criar função"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalNome({ titulo, descricao, exemplo, onCancelar, onSalvar }) {
  const [nome, setNome] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);

  async function salvar() {
    setOcupado(true);
    setErro(null);
    const r = await onSalvar(nome);
    if (r?.erro) { setErro(r.erro); setOcupado(false); }
  }

  return (
    <div className="overlay" onClick={onCancelar}>
      <div className="modal confirma" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="confirma-ico" style={{ background: "var(--off-bg)", color: "var(--ink)" }}>
            <Icone nome="acessos" size={20} />
          </div>
          <div><h3 style={{ fontSize: 17 }}>{titulo}</h3></div>
        </div>

        <div className="modal-body">
          {erro && <div className="aviso aviso-erro">{erro}</div>}
          <div className="small muted" style={{ marginBottom: 16 }}>{descricao}</div>
          <label className="field">
            <span>Nome</span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={exemplo}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && nome.trim() && salvar()}
            />
          </label>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onCancelar} disabled={ocupado}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={!nome.trim() || ocupado}>
            {ocupado ? "Criando..." : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** "Corte / Switcher" vira "corte-switcher", que é o id no banco. */
function paraSlug(texto = "") {
  return texto
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}
