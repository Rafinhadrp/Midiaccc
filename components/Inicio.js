"use client";
import { useEffect, useRef, useState } from "react";
import Icone from "./Icones";
import { tipoFuncao } from "@/lib/funcoes-texto";

/**
 * Monitor da tela de início: um "switcher" de transmissão que corta
 * sozinho entre as funções da equipe. Clicar numa miniatura corta para ela.
 */
export function MonitorAoVivo({ funcoes }) {
  const canais = funcoes.slice(0, 6);
  const [noAr, setNoAr] = useState(0);
  const pausadoAte = useRef(0);
  const [tc, setTc] = useState("00:00:00:00");

  // corte automático, como um diretor alternando as câmeras
  useEffect(() => {
    if (canais.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (Date.now() < pausadoAte.current) return;
      setNoAr((i) => (i + 1) % canais.length);
    }, 3800);
    return () => clearInterval(t);
  }, [canais.length]);

  // timecode correndo no canto do monitor
  useEffect(() => {
    const inicio = Date.now();
    const p = (n) => String(n).padStart(2, "0");
    let quadro;
    const tick = () => {
      const ms = Date.now() - inicio;
      const s = Math.floor(ms / 1000);
      setTc(`${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}:${p(Math.floor((ms % 1000) / 33.4))}`);
      quadro = requestAnimationFrame(tick);
    };
    quadro = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(quadro);
  }, []);

  if (!canais.length) return null;

  const atual = canais[noAr] ?? canais[0];
  const previa = canais[(noAr + 1) % canais.length];

  function cortar(i) {
    pausadoAte.current = Date.now() + 9000;
    setNoAr(i);
  }

  return (
    <div className="ini-monitor" aria-label="Monitor da transmissão">
      <div className="ini-pgm" style={{ "--c": atual.cor }}>
        <div className="ini-pgm-barra">
          <span className="ini-tally"><span className="ini-led" />PGM</span>
          <span className="ini-mono">{tc}</span>
        </div>
        <div className="ini-pgm-tela" key={atual.id}>
          <Cena tipo={tipoFuncao(atual)} />
        </div>
        <div className="ini-pgm-legenda">
          <span className="ini-funcao-ico pequeno"><Icone nome={atual.icone} size={15} /></span>
          <b>{atual.nome}</b>
          <span className="ini-mono ini-canal">CAM {String(noAr + 1).padStart(2, "0")}</span>
        </div>
      </div>

      <div className="ini-multiview" role="group" aria-label="Escolher função no monitor">
        {canais.map((f, i) => (
          <button
            type="button"
            key={f.id}
            className={"ini-miniatura" + (i === noAr ? " no-ar" : "") + (f === previa && canais.length > 2 ? " previa" : "")}
            style={{ "--c": f.cor }}
            onClick={() => cortar(i)}
            aria-pressed={i === noAr}
            aria-label={`Mostrar ${f.nome}`}
          >
            <span className="ini-mini-tela"><Cena tipo={tipoFuncao(f)} mini /></span>
            <span className="ini-mini-nome">
              <Icone nome={f.icone} size={12} />
              <span className="ini-mini-texto">{f.nome}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Contagem regressiva até o próximo culto. */
export function Contagem({ data, hora }) {
  const [agora, setAgora] = useState(null);

  useEffect(() => {
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const alvo = new Date(`${data}T${(hora ?? "19:00").slice(0, 5)}:00`).getTime();
  const p = (n) => String(n).padStart(2, "0");

  let texto = "--d --:--:--";
  if (agora !== null) {
    const falta = Math.max(0, Math.floor((alvo - agora) / 1000));
    const d = Math.floor(falta / 86400);
    texto = falta === 0
      ? "é hoje"
      : `${d}d ${p(Math.floor(falta / 3600) % 24)}:${p(Math.floor(falta / 60) % 60)}:${p(falta % 60)}`;
  }

  return <b className="ini-mono" suppressHydrationWarning>{texto}</b>;
}

/* ---------- cenas de cada função ---------- */

function Cena({ tipo, mini = false }) {
  const C = CENAS[tipo] ?? CENAS.outro;
  return (
    <span className={"ini-cena cena-" + tipo + (mini ? " mini" : "")}>
      <C mini={mini} />
    </span>
  );
}

const CENAS = {
  camera: ({ mini }) => (
    <>
      <span className="cena-palco" />
      <svg className="cena-pessoa" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="38" r="9" />
        <path d="M33 74c0-12 7-21 17-21s17 9 17 21z" />
        <rect x="36" y="66" width="28" height="22" rx="2" />
      </svg>
      <span className="cena-tercos" />
      <span className="cena-foco" />
      {!mini && (
        <>
          <span className="cena-hud topo"><i className="ini-led" />REC</span>
          <span className="cena-hud base">F2.8 · 1/60 · ISO 800 · 4K</span>
        </>
      )}
    </>
  ),
  som: ({ mini }) => {
    const canais = ["VOZ 1", "VOZ 2", "VIOLÃO", "TECLAS", "BAIXO", "BATERIA", "PASTOR", "MASTER"];
    return (
      <span className="cena-mesa">
        {canais.map((c, i) => (
          <span className="cena-canal" key={c}>
            <span className="cena-vu"><i style={{ animationDelay: `${-i * 0.37}s`, animationDuration: `${0.9 + (i % 3) * 0.25}s` }} /></span>
            {!mini && <span className="cena-canal-nome">{c}</span>}
          </span>
        ))}
      </span>
    );
  },
  projecao: ({ mini }) => (
    <span className="cena-slide">
      <span className="cena-letra">Santo, santo, santo</span>
      {!mini && <span className="cena-letra-2">Deus onipotente</span>}
      {!mini && <span className="cena-hud base">SLIDE 3/12 · PRÓXIMO: REFRÃO</span>}
    </span>
  ),
  transmissao: ({ mini }) => (
    <span className="cena-live">
      <span className="cena-live-selo"><i className="ini-led" />AO VIVO</span>
      {!mini && (
        <span className="cena-chat">
          <span>Amém! Assistindo daqui de casa</span>
          <span>Boa noite, igreja!</span>
          <span>Glória a Deus</span>
        </span>
      )}
      {!mini && <span className="cena-hud base">1080p · 6 Mbps · sinal estável</span>}
    </span>
  ),
  foto: ({ mini }) => (
    <>
      <svg className="cena-diafragma" viewBox="0 0 100 100" aria-hidden="true">
        {[0, 60, 120, 180, 240, 300].map((r) => (
          <path key={r} d="M50 50 L50 14 A36 36 0 0 1 81 32 Z" transform={`rotate(${r} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="13" className="cena-abertura" />
      </svg>
      <span className="cena-flash" />
      {!mini && <span className="cena-hud base">1/250 · f/4 · 248 fotos</span>}
    </>
  ),
  arte: ({ mini }) => (
    <span className="cena-arte">
      <span className="cena-poster">
        <span className="cena-poster-titulo">Culto da Família</span>
        {!mini && <span className="cena-poster-sub">domingo · 19h</span>}
      </span>
      {!mini && (
        <span className="cena-paleta">
          <i /><i /><i /><i />
        </span>
      )}
    </span>
  ),
  corte: ({ mini }) => (
    <span className="cena-switcher">
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={"cena-tecla" + (n === 2 ? " pgm" : n === 3 ? " pvw" : "")}>{!mini && n}</span>
      ))}
      {!mini && <span className="cena-hud base">CORTE · CAM 2 NO AR</span>}
    </span>
  ),
  luz: () => (
    <span className="cena-luzes"><i /><i /><i /></span>
  ),
  outro: () => (
    <span className="cena-logo"><img src="/logo-branca.png" alt="" /></span>
  ),
};
