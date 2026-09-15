"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseNavegador } from "@/lib/supabase/cliente";

export default function FormLogin() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  // erro vindo de um link expirado cai aqui pela URL
  const [erro, setErro] = useState(params.get("erro"));
  const [ocupado, setOcupado] = useState(false);
  const [recuperar, setRecuperar] = useState(false);
  const [aviso, setAviso] = useState(null);

  async function entrar() {
    setErro(null);
    setOcupado(true);
    const supabase = supabaseNavegador();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
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
    const supabase = supabaseNavegador();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    });
    setOcupado(false);
    if (error) setErro(error.message);
    else setAviso("Se esse e-mail estiver cadastrado, o link chega em instantes.");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div style={{ width: "100%", maxWidth: 390 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 30, color: "#fff", fontWeight: 800 }}>Multimídia</h1>
          <p className="small" style={{ color: "#8E91A3", marginTop: 6 }}>
            Entre para ver suas escalas e o painel do ministério.
          </p>
        </div>

        <div style={{ background: "#fff", borderRadius: 22, padding: 24 }}>
          {erro && <div className="aviso aviso-erro">{erro}</div>}
          {aviso && <div className="aviso aviso-ok">{aviso}</div>}

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
            <label className="field">
              <span>Senha</span>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                onKeyDown={(e) => e.key === "Enter" && entrar()}
              />
            </label>
          )}

          <button
            className="btn btn-primary"
            style={{ width: "100%", padding: 13 }}
            onClick={recuperar ? enviarRecuperacao : entrar}
            disabled={ocupado || !email.trim() || (!recuperar && !senha)}
          >
            {ocupado ? "Aguarde..." : recuperar ? "Enviar link de acesso" : "Entrar"}
          </button>

          <button
            className="linkout"
            style={{ marginTop: 10 }}
            onClick={() => { setRecuperar(!recuperar); setErro(null); setAviso(null); }}
          >
            {recuperar ? "Voltar para o login" : "Esqueci minha senha"}
          </button>

          <div className="small muted" style={{ marginTop: 10, textAlign: "center" }}>
            Você continua conectado neste aparelho até a sessão expirar.
          </div>
        </div>
      </div>
    </div>
  );
}
