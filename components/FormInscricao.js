"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Avatar from "./Avatar";
import Icone from "./Icones";
import CampoSenha from "./CampoSenha";

export default function FormInscricao({ funcoes }) {
  const fileRef = useRef(null);
  const [f, setF] = useState({
    nome: "", idade: "", telefone: "", email: "",
    funcoes: [], experiencia: "", disponibilidade: "", foto: null,
  });
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [pronto, setPronto] = useState(false);

  const senhaCurta = senha.length > 0 && senha.length < 8;
  const senhasDiferentes = confirma.length > 0 && senha !== confirma;

  const valido =
    f.nome.trim() && f.telefone.trim() && f.email.trim() &&
    f.funcoes.length > 0 && senha.length >= 8 && senha === confirma;

  function escolherFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setErro("A foto precisa ter menos de 3 MB."); return; }
    const r = new FileReader();
    r.onload = () => setF((v) => ({ ...v, foto: r.result }));
    r.readAsDataURL(file);
  }

  function alternar(id) {
    setF((v) => ({
      ...v,
      funcoes: v.funcoes.includes(id) ? v.funcoes.filter((x) => x !== id) : [...v.funcoes, id],
    }));
  }

  async function enviar() {
    setErro(null);
    setOcupado(true);
    try {
      const r = await fetch("/api/inscricoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, senha }),
      });
      const dados = await r.json();
      if (!r.ok) { setErro(dados.erro || "Não deu para enviar. Tente de novo."); setOcupado(false); return; }
      setPronto(true);
    } catch {
      setErro("Sem conexão. Verifique a internet e tente de novo.");
    }
    setOcupado(false);
  }

  if (pronto) {
    return (
      <div className="done">
        <div className="mark"><Icone nome="cheque" size={24} strokeWidth={2.2} /></div>
        <h3 style={{ fontSize: 21 }}>Inscrição recebida</h3>
        <p className="small muted" style={{ marginTop: 10, marginBottom: 20 }}>
          Sua conta já está criada. Assim que a liderança aprovar, você entra
          com o e-mail e a senha que acabou de escolher.
        </p>
        <Link className="btn" href="/login">Ir para o login</Link>
      </div>
    );
  }

  return (
    <>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      <div className="photo-pick">
        <button className="av-edit" onClick={() => fileRef.current?.click()} aria-label="Escolher foto de perfil">
          <Avatar nome={f.nome || "?"} foto={f.foto} size={62} />
          <span className="cam" aria-hidden="true">
            <Icone nome="editar" size={11} strokeWidth={2} />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={escolherFoto} />
        <div>
          <div className="t">Sua foto de perfil</div>
          <div className="s">Ajuda a equipe a te reconhecer na escala. Dá para colocar depois também.</div>
        </div>
      </div>

      <label className="field">
        <span>Nome completo</span>
        <input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Como está no seu documento" />
      </label>

      <div style={{ display: "flex", gap: 12 }}>
        <label className="field" style={{ width: 104 }}>
          <span>Idade</span>
          <input value={f.idade} onChange={(e) => setF({ ...f, idade: e.target.value })} inputMode="numeric" />
        </label>
        <label className="field" style={{ flex: 1 }}>
          <span>WhatsApp</span>
          <input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} placeholder="(11) 99999-0000" inputMode="tel" />
        </label>
      </div>

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

      <div className="divider" style={{ margin: "22px 0 18px" }} />

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Crie sua senha</div>
        <div className="small muted" style={{ marginTop: 3 }}>
          É com ela que você vai entrar quando a inscrição for aprovada.
        </div>
      </div>

      <CampoSenha
        rotulo="Senha"
        valor={senha}
        onChange={setSenha}
        autoComplete="new-password"
        forca
        erro={senhaCurta ? "Faltam pelo menos 8 caracteres." : null}
        ajuda="Mínimo de 8 caracteres."
      />

      <CampoSenha
        rotulo="Repita a senha"
        valor={confirma}
        onChange={setConfirma}
        autoComplete="new-password"
        erro={senhasDiferentes ? "As duas senhas não são iguais." : null}
      />

      <div className="divider" style={{ margin: "22px 0 18px" }} />

      <div className="field">
        <span>Onde você quer servir</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {funcoes.map((fn) => (
            <button
              key={fn.id}
              className={"pill pill-pick" + (f.funcoes.includes(fn.id) ? " pill-on" : "")}
              style={{ padding: "9px 13px" }}
              onClick={() => alternar(fn.id)}
            >
              <span className="fn-ico" style={{ color: f.funcoes.includes(fn.id) ? "#fff" : fn.cor }}>
                <Icone nome={fn.icone} size={15} />
              </span>
              {fn.nome}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>Já tem alguma experiência?</span>
        <textarea
          value={f.experiencia}
          onChange={(e) => setF({ ...f, experiencia: e.target.value })}
          placeholder="Se nunca mexeu com nada disso, escreva isso mesmo. Tem vaga para quem está começando."
        />
      </label>

      <label className="field">
        <span>Quais dias você pode servir</span>
        <input
          value={f.disponibilidade}
          onChange={(e) => setF({ ...f, disponibilidade: e.target.value })}
          placeholder="Domingo de manhã, quarta à noite..."
        />
      </label>

      <button className="btn btn-primary btn-bloco" style={{ padding: 13 }} onClick={enviar} disabled={!valido || ocupado}>
        {ocupado ? "Enviando..." : "Enviar inscrição"}
      </button>

      <div className="small muted" style={{ marginTop: 14, textAlign: "center" }}>
        Seus dados ficam só com a liderança do ministério.
      </div>
    </>
  );
}
