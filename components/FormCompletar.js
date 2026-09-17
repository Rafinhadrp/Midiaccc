"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import Marca from "./Marca";
import Icone from "./Icones";
import CampoSenha from "./CampoSenha";
import { supabaseNavegador } from "@/lib/supabase/cliente";

/**
 * Segundo passo de quem entrou pelo Google.
 *
 * O Google entrega nome, e-mail e foto. Falta o que o ministério
 * precisa: WhatsApp, data de nascimento e onde a pessoa quer servir.
 * A senha é opcional, porque a entrada pelo Google já autentica —
 * serve só para quem quiser também poder entrar por e-mail e senha.
 */
export default function FormCompletar({ usuario, funcoes, inscricoesAbertas }) {
  const router = useRouter();

  const [nome, setNome] = useState(usuario.nome ?? "");
  const [telefone, setTelefone] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [escolhidas, setEscolhidas] = useState([]);
  const [experiencia, setExperiencia] = useState("");
  const [disponibilidade, setDisponibilidade] = useState("");

  const [querSenha, setQuerSenha] = useState(false);
  const [senha, setSenha] = useState("");

  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const digitos = telefone.replace(/\D/g, "");
  const telefoneCurto = telefone.length > 0 && digitos.length < 10;
  const senhaCurta = querSenha && senha.length > 0 && senha.length < 8;

  const valido =
    nome.trim() &&
    digitos.length >= 10 &&
    (!inscricoesAbertas || escolhidas.length > 0) &&
    (!querSenha || senha.length >= 8);

  function alternar(id) {
    setEscolhidas((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  }

  async function enviar() {
    setErro(null);
    setOcupado(true);

    try {
      const r = await fetch("/api/completar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome, telefone, nascimento,
          funcoes: escolhidas,
          experiencia, disponibilidade,
        }),
      });

      const dados = await r.json();
      if (!r.ok) { setErro(dados.erro || "Não deu para concluir."); setOcupado(false); return; }

      // A senha é definida pelo navegador, com a sessão que já existe
      if (querSenha && senha.length >= 8) {
        const { error } = await supabaseNavegador().auth.updateUser({ password: senha });
        if (error) {
          setErro("Cadastro salvo, mas a senha não foi definida: " + error.message);
          setOcupado(false);
          return;
        }
      }

      router.push("/aguardando");
      router.refresh();
    } catch {
      setErro("Sem conexão. Tente de novo.");
      setOcupado(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", padding: "40px 18px 60px" }}>
      <div style={{ width: "100%", maxWidth: 460, margin: "0 auto" }}>
        <Marca />

        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 30, color: "#fff", fontWeight: 800 }}>Falta pouco</h1>
          <p className="small" style={{ color: "#8E91A3", marginTop: 8 }}>
            O Google já trouxe seu nome e e-mail. Complete o que o ministério precisa saber.
          </p>
        </div>

        <div style={{ background: "#fff", borderRadius: 18, padding: 24 }}>
          {erro && <div className="aviso aviso-erro">{erro}</div>}

          <div className="conta-google">
            <Avatar nome={nome || "?"} foto={usuario.foto} size={44} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{usuario.email}</div>
              <div className="small muted">Conta do Google conectada</div>
            </div>
            <Icone nome="cheque" size={18} style={{ color: "var(--go)", marginLeft: "auto" }} />
          </div>

          <label className="field">
            <span>Nome completo</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como está no seu documento" />
          </label>

          <div style={{ display: "flex", gap: 12 }}>
            <label className="field" style={{ flex: 1 }}>
              <span>WhatsApp</span>
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                inputMode="tel"
                placeholder="(11) 99999-0000"
              />
              {telefoneCurto && (
                <span className="small" style={{ color: "#B42318", fontWeight: 400, marginTop: 6, display: "block" }}>
                  Informe o número com DDD.
                </span>
              )}
            </label>

            <label className="field" style={{ width: 150 }}>
              <span>Nascimento</span>
              <input type="date" value={nascimento} onChange={(e) => setNascimento(e.target.value)} />
            </label>
          </div>

          {inscricoesAbertas ? (
            <>
              <div className="divider" style={{ margin: "18px 0" }} />

              <div className="field">
                <span>Onde você quer servir</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {funcoes.map((fn) => {
                    const on = escolhidas.includes(fn.id);
                    return (
                      <button
                        key={fn.id}
                        className={"pill pill-pick" + (on ? " pill-on" : "")}
                        style={{ padding: "9px 13px" }}
                        onClick={() => alternar(fn.id)}
                      >
                        <span className="fn-ico" style={{ color: on ? "#fff" : fn.cor }}>
                          <Icone nome={fn.icone} size={15} />
                        </span>
                        {fn.nome}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="field">
                <span>Já tem alguma experiência?</span>
                <textarea
                  value={experiencia}
                  onChange={(e) => setExperiencia(e.target.value)}
                  placeholder="Se nunca mexeu com nada disso, escreva isso mesmo. Tem vaga para quem está começando."
                />
              </label>

              <label className="field">
                <span>Quais dias você pode servir</span>
                <input
                  value={disponibilidade}
                  onChange={(e) => setDisponibilidade(e.target.value)}
                  placeholder="Domingo de manhã, quarta à noite..."
                />
              </label>
            </>
          ) : (
            <div className="aviso" style={{ background: "var(--off-bg)", color: "var(--muted)" }}>
              As inscrições estão fechadas no momento. Seu cadastro fica guardado e a
              liderança avisa quando abrir uma turma nova.
            </div>
          )}

          <div className="divider" style={{ margin: "18px 0" }} />

          <label className="linha-acao" style={{ cursor: "pointer", marginBottom: querSenha ? 16 : 20 }}>
            <input
              type="checkbox"
              checked={querSenha}
              onChange={(e) => setQuerSenha(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--ink)" }}
            />
            <div className="cresce">
              <div style={{ fontSize: 14, fontWeight: 600 }}>Também quero uma senha</div>
              <div className="small muted">
                Opcional. Serve para entrar sem depender do Google.
              </div>
            </div>
          </label>

          {querSenha && (
            <CampoSenha
              rotulo="Senha"
              valor={senha}
              onChange={setSenha}
              autoComplete="new-password"
              forca
              erro={senhaCurta ? "Faltam pelo menos 8 caracteres." : null}
              ajuda="Mínimo de 8 caracteres."
            />
          )}

          <button
            className="btn btn-primary btn-bloco"
            style={{ padding: 13 }}
            onClick={enviar}
            disabled={!valido || ocupado}
          >
            {ocupado ? "Enviando..." : "Concluir cadastro"}
          </button>

          <div className="small muted" style={{ marginTop: 14, textAlign: "center" }}>
            Seus dados ficam só com a liderança do ministério.
          </div>
        </div>
      </div>
    </div>
  );
}
