"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseNavegador } from "@/lib/supabase/cliente";

export default function FormNovaSenha({ nome, email }) {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);
  const [pronto, setPronto] = useState(false);

  const primeiro = nome ? nome.trim().split(/\s+/)[0] : null;
  const curta = senha.length > 0 && senha.length < 8;
  const diferentes = confirma.length > 0 && senha !== confirma;
  const valido = senha.length >= 8 && senha === confirma;

  async function salvar() {
    setErro(null);
    setOcupado(true);

    const { error } = await supabaseNavegador().auth.updateUser({ password: senha });
    setOcupado(false);

    if (error) {
      setErro("Não deu para salvar: " + error.message);
      return;
    }

    setPronto(true);
    setTimeout(() => {
      router.push("/painel");
      router.refresh();
    }, 1600);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div style={{ width: "100%", maxWidth: 390 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 30, color: "#fff", fontWeight: 800 }}>
            {primeiro ? `Olá, ${primeiro}` : "Nova senha"}
          </h1>
          <p className="small" style={{ color: "#8E91A3", marginTop: 6 }}>
            {pronto ? "Tudo certo." : `Crie a senha de acesso para ${email}.`}
          </p>
        </div>

        <div style={{ background: "#fff", borderRadius: 22, padding: 24 }}>
          {pronto ? (
            <div className="done" style={{ padding: "8px 0" }}>
              <div className="mark">✓</div>
              <h3 style={{ fontSize: 19 }}>Senha criada</h3>
              <p className="small muted" style={{ marginTop: 8 }}>
                Levando você para o painel...
              </p>
            </div>
          ) : (
            <>
              {erro && <div className="aviso aviso-erro">{erro}</div>}

              <label className="field">
                <span>Nova senha</span>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="new-password"
                  autoFocus
                />
                <span className="small muted" style={{ fontWeight: 400, marginTop: 5, display: "block" }}>
                  {curta ? "Faltam pelo menos 8 caracteres." : "Pelo menos 8 caracteres."}
                </span>
              </label>

              <label className="field">
                <span>Repita a senha</span>
                <input
                  type="password"
                  value={confirma}
                  onChange={(e) => setConfirma(e.target.value)}
                  autoComplete="new-password"
                  onKeyDown={(e) => e.key === "Enter" && valido && salvar()}
                />
                {diferentes && (
                  <span className="small" style={{ color: "#B42318", fontWeight: 400, marginTop: 5, display: "block" }}>
                    As duas senhas não são iguais.
                  </span>
                )}
              </label>

              <button
                className="btn btn-primary"
                style={{ width: "100%", padding: 13 }}
                onClick={salvar}
                disabled={!valido || ocupado}
              >
                {ocupado ? "Salvando..." : "Salvar e entrar"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
