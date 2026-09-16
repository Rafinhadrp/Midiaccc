"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseNavegador } from "@/lib/supabase/cliente";
import Marca from "./Marca";
import Icone from "./Icones";

export default function ConfirmarRecuperacao() {
  const router = useRouter();
  const params = useSearchParams();
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const p = new URLSearchParams(hash);
    const codigo = p.get("error_code");
    if (!codigo) return;

    setErro(
      codigo === "otp_expired"
        ? "Esse link já foi usado ou passou de uma hora. Peça um novo na tela de login."
        : p.get("error_description") ?? "Não foi possível validar o link."
    );
  }, []);

  async function confirmar() {
    setOcupado(true);
    setErro(null);
    const supabase = supabaseNavegador();

    const tokenHash = params.get("token_hash");
    const codigo = params.get("code");
    let falha = null;

    if (tokenHash) {
      const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
      falha = error;
    } else if (codigo) {
      const { error } = await supabase.auth.exchangeCodeForSession(codigo);
      falha = error;
    } else {
      falha = { message: "O link veio sem o código de verificação." };
    }

    if (falha) {
      setOcupado(false);
      setErro(
        /expired|invalid/i.test(falha.message)
          ? "Esse link já foi usado ou passou de uma hora. Peça um novo na tela de login."
          : falha.message
      );
      return;
    }

    router.push("/redefinir-senha");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <Marca />

        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 30, color: "#fff", fontWeight: 800 }}>Redefinir senha</h1>
          <p className="small" style={{ color: "#8E91A3", marginTop: 8 }}>
            Falta um passo para criar sua senha nova.
          </p>
        </div>

        <div style={{ background: "#fff", borderRadius: 18, padding: 24 }}>
          {erro ? (
            <>
              <div className="aviso aviso-erro">{erro}</div>
              <Link className="btn btn-bloco" href="/login" style={{ textAlign: "center" }}>
                Voltar para o login
              </Link>
            </>
          ) : (
            <>
              <div className="small muted" style={{ marginBottom: 18 }}>
                Confirme abaixo que foi você quem pediu a troca de senha.
              </div>
              <button
                className="btn btn-primary btn-bloco btn-linha"
                style={{ padding: 13 }}
                onClick={confirmar}
                disabled={ocupado}
              >
                <Icone nome="cadeado" size={16} />
                {ocupado ? "Validando..." : "Criar nova senha"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
