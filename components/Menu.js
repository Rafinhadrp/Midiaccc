"use client";
import { useEffect, useRef, useState } from "react";
import Icone from "./Icones";

/**
 * Menu de três pontos. Fecha ao clicar fora ou apertar Esc.
 *
 * <Menu itens={[{ nome, icone, onClick, perigo }]} />
 */
export default function Menu({ itens, titulo, rotulo = "Mais opções" }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!aberto) return;

    function fora(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false);
    }
    function esc(e) {
      if (e.key === "Escape") setAberto(false);
    }

    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const visiveis = itens.filter(Boolean);
  if (!visiveis.length) return null;

  return (
    <div className="menu-wrap" ref={ref}>
      <button
        className="btn-ico"
        onClick={() => setAberto(!aberto)}
        aria-label={rotulo}
        aria-expanded={aberto}
      >
        <Icone nome="maisPontos" size={18} />
      </button>

      {aberto && (
        <div className="menu" role="menu">
          {titulo && <div className="menu-titulo">{titulo}</div>}
          {visiveis.map((item, i) =>
            item.separador ? (
              <div className="menu-sep" key={`sep-${i}`} />
            ) : (
              <button
                key={item.nome}
                className={"menu-item" + (item.perigo ? " perigo" : "")}
                role="menuitem"
                onClick={() => { setAberto(false); item.onClick?.(); }}
              >
                {item.icone && <Icone nome={item.icone} size={16} />}
                {item.nome}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
