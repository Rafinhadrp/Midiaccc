"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import AvatarUpload from "./AvatarUpload";
import { supabaseNavegador } from "@/lib/supabase/cliente";

export default function ListaMembros({ membros, funcoes, papeis, podeEditar, meuId }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState(null);
  const [expandido, setExpandido] = useState(null);
  const [senhaDe, setSenhaDe] = useState(null);

  const lista = membros.filter((m) => {
    const alvo = (m.nome + " " + (m.usuario ?? "")).toLowerCase();
    return alvo.includes(busca.toLowerCase());
  });

  async function mudarPapel(id, papel_id) {
    const { error } = await supabaseNavegador().from("perfis").update({ papel_id }).eq("id", id);
    if (error) setErro(error.message);
    else router.refresh();
  }

  async function alternarFuncao(perfilId, funcaoId, tem) {
    const supabase = supabaseNavegador();
    const { error } = tem
      ? await supabase.from("perfil_funcoes").delete().eq("perfil_id", perfilId).eq("funcao_id", funcaoId)
      : await supabase.from("perfil_funcoes").insert({ perfil_id: perfilId, funcao_id: funcaoId });
    if (error) setErro(error.message);
    else router.refresh();
  }

  return (
    <>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar pelo nome ou usuário"
        style={{ width: "100%", padding: "12px 16px", border: "1px solid var(--line)", borderRadius: 999, background: "#fff" }}
      />

      <div className="card block" style={{ marginTop: 14 }}>
        <div className="block-head">
          <div>
            <h3>Equipe</h3>
            <div className="sub">Toque na foto de alguém para trocar a imagem</div>
          </div>
        </div>

        {lista.map((m) => {
          const podeTrocarFoto = podeEditar || m.id === meuId;
          return (
            <div className="item" key={m.id}>
              <div className="item-head">
                {podeTrocarFoto
                  ? <AvatarUpload perfilId={m.id} nome={m.nome} foto={m.foto_url} size={48} onTrocou={() => router.refresh()} />
                  : <Avatar nome={m.nome} foto={m.foto_url} size={48} />}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="item-name">{m.nome}</div>
                  <div className="item-meta">
                    {m.usuario ? `@${m.usuario} · ` : ""}{m.telefone || m.email}
                  </div>
                  <div className="tags">
                    {funcoes
                      .filter((f) => m.funcoes.includes(f.id))
                      .map((f) => (
                        <span className="pill" key={f.id}>
                          <span className="fdot" style={{ background: f.cor }} />
                          {f.nome}
                        </span>
                      ))}
                    {m.funcoes.length === 0 && <span className="small muted">sem função definida</span>}
                  </div>
                </div>

                {podeEditar && (
                  <select
                    value={m.papel_id}
                    onChange={(e) => mudarPapel(m.id, e.target.value)}
                    style={{ padding: "7px 11px", border: "1px solid var(--line)", borderRadius: 999, background: "#fff", fontSize: 13, fontWeight: 600 }}
                  >
                    {papeis.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                )}
              </div>

              {podeEditar && (
                <div className="item-actions" style={{ paddingLeft: 61 }}>
                  <button className="btn btn-sm" onClick={() => setExpandido(expandido === m.id ? null : m.id)}>
                    {expandido === m.id ? "Fechar funções" : "Editar funções"}
                  </button>
                  <button className="btn btn-sm" onClick={() => setSenhaDe(m)}>
                    Redefinir senha
                  </button>
                </div>
              )}

              {podeEditar && expandido === m.id && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 11, paddingLeft: 61 }}>
                  {funcoes.map((f) => {
                    const tem = m.funcoes.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        className={"pill pill-pick" + (tem ? " pill-on" : "")}
                        onClick={() => alternarFuncao(m.id, f.id, tem)}
                      >
                        <span className="fdot" style={{ background: f.cor }} />
                        {f.nome}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {lista.length === 0 && <div className="empty small">Ninguém com esse nome.</div>}
      </div>

      {senhaDe && <ModalSenha membro={senhaDe} onFechar={() => setSenhaDe(null)} />}
    </>
  );
}

function ModalSenha({ membro, onFechar }) {
  const [modo, setModo] = useState("link");
  const [senha, setSenha] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState(null);

  async function enviar() {
    setOcupado(true);
    setAviso(null);
    try {
      const r = await fetch(`/api/membros/${membro.id}/senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modo, senha }),
      });
      const dados = await r.json();

      if (!r.ok) {
        setAviso({ tipo: "erro", texto: dados.erro || "Não deu certo." });
      } else if (modo === "link" && !dados.enviado) {
        setAviso({ tipo: "erro", texto: `O link foi gerado, mas o e-mail não saiu: ${dados.erroEnvio}` });
      } else if (modo === "link") {
        setAviso({ tipo: "ok", texto: `Link enviado para ${membro.email}.` });
      } else {
        setAviso({
          tipo: "ok",
          texto: "Senha definida. Passe para a pessoa e peça que ela troque assim que entrar.",
        });
        setSenha("");
      }
    } catch {
      setAviso({ tipo: "erro", texto: "Sem conexão com o servidor." });
    }
    setOcupado(false);
  }

  return (
    <div className="overlay" onClick={onFechar}>
      <div className="modal modal-estreito" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <Avatar nome={membro.nome} foto={membro.foto_url} size={44} />
          <div>
            <h3 style={{ fontSize: 18 }}>Redefinir senha</h3>
            <div className="small muted">{membro.nome}</div>
          </div>
        </div>

        <div className="modal-body">
          {aviso && <div className={"aviso aviso-" + aviso.tipo}>{aviso.texto}</div>}

          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {[["link", "Enviar link"], ["temporaria", "Senha temporária"]].map(([id, nome]) => (
              <button
                key={id}
                className={"pill pill-pick" + (modo === id ? " pill-on" : "")}
                style={{ padding: "9px 15px" }}
                onClick={() => { setModo(id); setAviso(null); }}
              >
                {nome}
              </button>
            ))}
          </div>

          {modo === "link" ? (
            <div className="small muted">
              A pessoa recebe um e-mail em {membro.email} com um link para criar a própria senha.
              O link vale por uma hora. Você não fica sabendo a senha dela, que é como deve ser.
            </div>
          ) : (
            <>
              <div className="small muted" style={{ marginBottom: 14 }}>
                Use só quando a pessoa não conseguir acessar o e-mail. Combine a senha com ela
                pessoalmente e peça que troque no primeiro acesso, em Meu perfil.
              </div>
              <label className="field">
                <span>Senha temporária</span>
                <input
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="mínimo 8 caracteres"
                  autoComplete="off"
                />
              </label>
            </>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onFechar} disabled={ocupado}>Fechar</button>
          <button
            className="btn btn-primary"
            onClick={enviar}
            disabled={ocupado || (modo === "temporaria" && senha.length < 8)}
          >
            {ocupado ? "Aguarde..." : modo === "link" ? "Enviar link" : "Definir senha"}
          </button>
        </div>
      </div>
    </div>
  );
}
