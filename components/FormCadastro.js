"use client";
import { useState } from "react";
import Link from "next/link";
import Marca from "./Marca";
import Rodape from "./Rodape";
import CampoSenha from "./CampoSenha";
import BotaoGoogle from "./BotaoGoogle";
import Icone from "./Icones";

export default function FormCadastro() {
  const [f, setF] = useState({ nome: "", telefone: "", email: "" });
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [pronto, setPronto] = useState(false);

  const curta = senha.length > 0 && senha.length < 8;
  const diferentes = confirma.length > 0 && senha !== confirma;
  const digitos = f.telefone.replace(/\D/g, "");
  const telefoneCurto = f.telefone.length > 0 && digitos.length < 10;

  const valido =
    f.nome.trim() && f.email.trim() && digitos.length >= 10 &&
    senha.length >= 8 && senha === confirma;

  async function enviar() {
    setErro(null);
    setOcupado(true);
    try {
      const r = await fetch("/api/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, senha }),
      });
      const dados = await r.json();
      if (!r.ok) { setErro(dados.erro || "Não deu para cadastrar."); setOcupado(false); return; }
      setPronto(true);
    } catch {
      setErro("Sem conexão. Verifique a internet e tente de novo.");
    }
    setOcupado(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <Marca />

        {pronto ? (
          <div style={{ background: "#fff", borderRadius: 18, padding: 26 }}>
            <div className="done" style={{ padding: "4px 0" }}>
              <div className="mark"><Icone nome="cheque" size={24} strokeWidth={2.2} /></div>
              <h3 style={{ fontSize: 20 }}>Conta criada</h3>
              <p className="small muted" style={{ marginTop: 10, marginBottom: 20 }}>
                A liderança vai analisar seu cadastro. Quando liberarem seu acesso, você
                entra com o e-mail e a senha que acabou de escolher.
              </p>
              <Link className="btn btn-bloco" href="/login">Ir para o login</Link>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontSize: 30, color: "#fff", fontWeight: 800 }}>Criar conta</h1>
              <p className="small" style={{ color: "#8E91A3", marginTop: 8 }}>
                Cadastro rápido, só com o essencial.
              </p>
            </div>

            <div style={{ background: "#fff", borderRadius: 18, padding: 24 }}>
              {erro && <div className="aviso aviso-erro">{erro}</div>}

              <BotaoGoogle rotulo="Cadastrar com o Google" />
              <div className="ou">ou preencha abaixo</div>

              <label className="field">
                <span>Nome completo</span>
                <input
                  value={f.nome}
                  onChange={(e) => setF({ ...f, nome: e.target.value })}
                  placeholder="Como está no seu documento"
                />
              </label>

              <label className="field">
                <span>E-mail</span>
                <input
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                  inputMode="email"
                  autoComplete="email"
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
                {telefoneCurto ? (
                  <span className="small" style={{ color: "#B42318", fontWeight: 400, marginTop: 6, display: "block" }}>
                    Informe o número com DDD.
                  </span>
                ) : (
                  <span className="small muted" style={{ fontWeight: 400, marginTop: 6, display: "block" }}>
                    É por aqui que a liderança entra em contato.
                  </span>
                )}
              </label>

              <CampoSenha
                rotulo="Senha"
                valor={senha}
                onChange={setSenha}
                autoComplete="new-password"
                forca
                erro={curta ? "Faltam pelo menos 8 caracteres." : null}
                ajuda="Mínimo de 8 caracteres."
              />

              <CampoSenha
                rotulo="Repita a senha"
                valor={confirma}
                onChange={setConfirma}
                autoComplete="new-password"
                erro={diferentes ? "As duas senhas não são iguais." : null}
                onEnter={() => valido && enviar()}
              />

              <button
                className="btn btn-primary btn-bloco"
                style={{ padding: 12 }}
                onClick={enviar}
                disabled={!valido || ocupado}
              >
                {ocupado ? "Criando..." : "Criar conta"}
              </button>
            </div>

            <div className="rodape-escuro">
              Já tem conta? <Link href="/login">Entrar</Link>
            </div>
          </>
        )}

        <Rodape />
      </div>
    </div>
  );
}