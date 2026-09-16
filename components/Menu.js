"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Icone from "./Icones";

/**
 * Menu de três pontos. Abre para baixo quando cabe, para cima quando
 * está perto do fim da tela, e vira folha deslizante no celular.
 */
export default function Menu({ itens, titulo, rotulo = "Mais opções" }) {
  const [aberto, setAberto] = useState(false);
  const [paraCima, setParaCima] = useState(false);
  const [celular, setCelular] = useState(false);
  const ref = useRef(null);
  const botaoRef = useRef(null);

  // Decide o lado antes de pintar, para não piscar no lugar errado
  useLayoutEffect(() => {
    if (!aberto) return;

    const estreito = window.innerWidth <= 640;
    setCelular(estreito);
    if (estreito) return;

    const r = botaoRef.current?.getBoundingClientRect();
    if (!r) return;

    const alturaMenu = Math.min(itens.filter(Boolean).length * 40 + 20, 280);
    const espacoAbaixo = window.innerHeight - r.bottom;
    setParaCima(espacoAbaixo < alturaMenu + 16 && r.top > alturaMenu);
  }, [aberto, itens]);

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
    window.addEventListener("resize", () => setAberto(false));
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const visiveis = itens.filter(Boolean);
  if (!visiveis.length) return null;

  const conteudo = (
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
  );

  return (
    <div className={"menu-wrap" + (paraCima ? " para-cima" : "")} ref={ref}>
      <button
        ref={botaoRef}
        className="btn-ico"
        onClick={() => setAberto(!aberto)}
        aria-label={rotulo}
        aria-expanded={aberto}
      >
        <Icone nome="maisPontos" size={18} />
      </button>

      {aberto && (celular ? (
        <div className="folha-fundo" onClick={() => setAberto(false)}>
          <div className="folha" onClick={(e) => e.stopPropagation()}>
            <div className="folha-alca" />
            {conteudo}
          </div>
        </div>
      ) : conteudo)}
    </div>
  );
}
