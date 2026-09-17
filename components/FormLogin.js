"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseNavegador } from "@/lib/supabase/cliente";
import CampoSenha from "./CampoSenha";
import BotaoGoogle from "./BotaoGoogle";
import Marca from "./Marca";
import Rodape from "./Rodape";
import Icone from "./Icones";

export default function FormLogin() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(params.get("erro"));
  const [ocupado, setOcupado] = useState(false);
  const [recuperar, setRecuperar] = useState(false);
  const [aviso, setAviso] = useState(null);

  // Erros do Supabase chegam no fragmento (#), que não vai ao servidor
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const p = new URLSearchParams(hash);
    const codigo = p.get("error_code");
    if (!codigo) return;

    setErro(
      codigo === "otp_expired"
        ? "Esse link já foi usado ou passou de uma hora. Peça um novo abaixo."
        : p.get("error_description") ?? "Não foi possível validar o link."
    );
    history.replaceState(null, "", window.location.pathname);
  }, []);

  async function entrar() {
    setErro(null);
    setOcupado(true);
    const { error } = await supabaseNavegador().auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    setOcupado(false);
    if (error) {
      setErro("E-mail ou senha não conferem.");
      return;
    }
    router.push(params.get("voltar") || "/painel");
    router.refresh();
  }

  async function enviarRecuperacao() {
    setErro(null);
    setOcupado(true);
    const { error } = await supabaseNavegador().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/recuperar`,
    });
    setOcupado(false);
    if (error) setErro(error.message);
    else setAviso("Se esse e-mail estiver cadastrado, o link chega em instantes.");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <Marca />

        <div style={{ marginBottom: 22 }}>
          {recuperar && (
            <button
              className="btn-linha"
              style={{ border: 0, background: "transparent", color: "#8E91A3", padding: 0, marginBottom: 12, fontSize: 13.5, fontWeight: 600 }}
              onClick={() => { setRecuperar(false); setErro(null); setAviso(null); }}
            >
              <Icone nome="voltar" size={16} /> Voltar
            </button>
          )}
          <h1 style={{ fontSize: 30, color: "#fff", fontWeight: 800 }}>
            {recuperar ? "Recuperar acesso" : "Entrar"}
          </h1>
          <p className="small" style={{ color: "#8E91A3", marginTop: 8 }}>
            {recuperar
              ? "Informe seu e-mail e enviamos um link para criar uma senha nova."
              : "Acesse suas escalas e o painel do ministério."}
          </p>
        </div>

        <div style={{ background: "#fff", borderRadius: 18, padding: 24 }}>
          {erro && <div className="aviso aviso-erro">{erro}</div>}
          {aviso && <div className="aviso aviso-ok">{aviso}</div>}

          {!recuperar && (
            <>
              <BotaoGoogle rotulo="Entrar com o Google" />
              <div className="ou">ou</div>
            </>
          )}

          <label className="field">
            <span>E-mail</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              autoComplete="email"
              placeholder="voce@email.com"
            />
          </label>

          {!recuperar && (
            <CampoSenha rotulo="Senha" valor={senha} onChange={setSenha} onEnter={entrar} />
          )}

          <button
            className="btn btn-primary btn-bloco"
            style={{ padding: 12 }}
            onClick={recuperar ? enviarRecuperacao : entrar}
            disabled={ocupado || !email.trim() || (!recuperar && !senha)}
          >
            {ocupado ? "Aguarde..." : recuperar ? "Enviar link" : "Entrar"}
          </button>

          {!recuperar && (
            <button className="linkout" style={{ marginTop: 10 }} onClick={() => setRecuperar(true)}>
              Esqueci minha senha
            </button>
          )}
        </div>

        {!recuperar && (
          <div className="rodape-escuro">
            Ainda não tem conta? <Link href="/cadastrar">Criar conta</Link>
            <span style={{ margin: "0 8px", opacity: 0.4 }}>·</span>
            <Link href="/inscrever">Quero servir</Link>
          </div>
        )}

        <Rodape />
      </div>
    </div>
  );
}