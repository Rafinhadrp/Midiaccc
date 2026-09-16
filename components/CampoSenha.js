"use client";
import { useState } from "react";
import Icone from "./Icones";

/** Campo de senha com o olho para revelar e barra de força opcional. */
export default function CampoSenha({
  rotulo,
  valor,
  onChange,
  ajuda,
  erro,
  forca = false,
  autoComplete = "current-password",
  autoFocus = false,
  onEnter,
}) {
  const [aberto, setAberto] = useState(false);
  const nivel = medirForca(valor);

  return (
    <label className="field">
      {rotulo && <span>{rotulo}</span>}
      <div className="senha-wrap">
        <input
          type={aberto ? "text" : "password"}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        />
        <button
          type="button"
          className="senha-olho"
          onClick={() => setAberto(!aberto)}
          aria-label={aberto ? "Esconder senha" : "Mostrar senha"}
          title={aberto ? "Esconder senha" : "Mostrar senha"}
        >
          <Icone nome={aberto ? "olhoFechado" : "olho"} size={17} />
        </button>
      </div>

      {forca && valor.length > 0 && (
        <div className="forca" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <i key={n} className={nivel >= n ? `on-${nivel}` : ""} />
          ))}
        </div>
      )}

      {erro ? (
        <span className="small" style={{ color: "#B42318", fontWeight: 400, marginTop: 6, display: "block" }}>
          {erro}
        </span>
      ) : ajuda ? (
        <span className="small muted" style={{ fontWeight: 400, marginTop: 6, display: "block" }}>
          {ajuda}
        </span>
      ) : null}
    </label>
  );
}

/** 1 fraca, 2 razoável, 3 boa. Serve de sinal visual, não de regra. */
export function medirForca(senha = "") {
  if (senha.length < 8) return 1;
  let pontos = 0;
  if (senha.length >= 12) pontos++;
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++;
  if (/\d/.test(senha)) pontos++;
  if (/[^a-zA-Z0-9]/.test(senha)) pontos++;
  return pontos >= 3 ? 3 : pontos >= 1 ? 2 : 1;
}
