"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseNavegador } from "@/lib/supabase/cliente";
import CampoSenha from "./CampoSenha";
import Icone from "./Icones";

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
    setTimeout(() => { router.push("/painel"); router.refresh(); }, 1500);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ marginBottom: 26 }}>
          <h1 style={{ fontSize: 32, color: "#fff", fontWeight: 800 }}>
            {primeiro ? `Olá, ${primeiro}` : "Nova senha"}
          </h1>
          <p className="small" style={{ color: "#8E91A3", marginTop: 8 }}>
            {pronto ? "Tudo certo." : `Crie a senha de acesso para ${email}.`}
          </p>
        </div>

        <div style={{ background: "#fff", borderRadius: 18, padding: 24 }}>
          {pronto ? (
            <div className="done" style={{ padding: "8px 0" }}>
              <div className="mark"><Icone nome="cheque" size={24} strokeWidth={2.2} /></div>
              <h3 style={{ fontSize: 19 }}>Senha criada</h3>
              <p className="small muted" style={{ marginTop: 8 }}>Levando você para o painel...</p>
            </div>
          ) : (
            <>
              {erro && <div className="aviso aviso-erro">{erro}</div>}

              <CampoSenha
                rotulo="Nova senha"
                valor={senha}
                onChange={setSenha}
                autoComplete="new-password"
                autoFocus
                forca
                erro={curta ? "Faltam pelo menos 8 caracteres." : null}
                ajuda="Pelo menos 8 caracteres."
              />

              <CampoSenha
                rotulo="Repita a senha"
                valor={confirma}
                onChange={setConfirma}
                autoComplete="new-password"
                erro={diferentes ? "As duas senhas não são iguais." : null}
                onEnter={() => valido && salvar()}
              />

              <button
                className="btn btn-primary btn-bloco"
                style={{ padding: 12 }}
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
