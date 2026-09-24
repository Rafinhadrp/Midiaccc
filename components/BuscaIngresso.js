"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icone from "./Icones";

export default function BuscaIngresso() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");

  function abrir() {
    const limpo = codigo.trim().toUpperCase().replace(/\s/g, "");
    if (!limpo) return;
    router.push(`/ingresso/${encodeURIComponent(limpo)}`);
  }

  return (
    <>
      <label className="field">
        <span>Código do ingresso</span>
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="MM-XXXXXX"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && abrir()}
          style={{ letterSpacing: "0.08em", fontWeight: 600 }}
        />
      </label>

      <button className="btn btn-primary btn-bloco btn-linha" onClick={abrir} disabled={!codigo.trim()}>
        <Icone nome="busca" size={16} /> Buscar
      </button>
    </>
  );
}
