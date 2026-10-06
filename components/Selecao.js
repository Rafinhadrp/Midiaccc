"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Icone from "./Icones";

/**
 * Campo de escolha no estilo de vidro, no lugar do <select> do navegador.
 * Abre para baixo quando cabe, para cima perto do fim da tela, e vira
 * folha deslizante no celular, igual ao menu de três pontos.
 *
 * opcoes: [{ valor, nome, desabilitado? }]
 * onChange recebe o valor da opção escolhida.
 */
export default function Selecao({ value, onChange, opcoes, rotulo, pequeno = false, className = "", style }) {
  const [aberto, setAberto] = useState(false);
  const [paraCima, setParaCima] = useState(false);
  const [celular, setCelular] = useState(false);
  const [foco, setFoco] = useState(-1);
  const ref = useRef(null);
  const botaoRef = useRef(null);
  const listaRef = useRef(null);
  const id = useId();

  const atual = opcoes.find((o) => String(o.valor) === String(value ?? ""));
  const indiceAtual = opcoes.findIndex((o) => o === atual);

  useLayoutEffect(() => {
    if (!aberto) return;

    const estreito = window.innerWidth <= 640;
    setCelular(estreito);
    setFoco(indiceAtual >= 0 ? indiceAtual : opcoes.findIndex((o) => !o.desabilitado));
    if (estreito) return;

    const r = botaoRef.current?.getBoundingClientRect();
    if (!r) return;
    const alturaLista = Math.min(opcoes.length * 42 + 12, 300);
    const espacoAbaixo = window.innerHeight - r.bottom;
    setParaCima(espacoAbaixo < alturaLista + 16 && r.top > alturaLista);
  }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!aberto) return;
    function fora(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false);
    }
    function redimensionou() { setAberto(false); }
    document.addEventListener("mousedown", fora);
    document.addEventListener("touchstart", fora);
    window.addEventListener("resize", redimensionou);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("touchstart", fora);
      window.removeEventListener("resize", redimensionou);
    };
  }, [aberto]);

  // mantém a opção em foco visível ao navegar pelo teclado
  useEffect(() => {
    if (!aberto || foco < 0) return;
    listaRef.current?.querySelectorAll("[role=option]")[foco]?.scrollIntoView({ block: "nearest" });
  }, [aberto, foco]);

  function escolher(o) {
    if (!o || o.desabilitado) return;
    setAberto(false);
    botaoRef.current?.focus();
    if (String(o.valor) !== String(value ?? "")) onChange?.(o.valor);
  }

  function mover(passo) {
    if (!opcoes.length) return;
    let i = foco;
    for (let n = 0; n < opcoes.length; n++) {
      i = (i + passo + opcoes.length) % opcoes.length;
      if (!opcoes[i].desabilitado) { setFoco(i); return; }
    }
  }

  function tecla(e) {
    if (!aberto) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        setAberto(true);
      }
      return;
    }
    if (e.key === "Escape" || e.key === "Tab") { setAberto(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); mover(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); mover(-1); }
    else if (e.key === "Home") { e.preventDefault(); setFoco(-1); mover(1); }
    else if (e.key === "End") { e.preventDefault(); setFoco(opcoes.length); mover(-1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); escolher(opcoes[foco]); }
  }

  const lista = (
    <div className="selecao-lista" role="listbox" id={id} aria-label={rotulo} ref={listaRef}>
      {opcoes.map((o, i) => {
        const marcado = o === atual;
        return (
          <button
            type="button"
            key={String(o.valor) + i}
            role="option"
            aria-selected={marcado}
            disabled={o.desabilitado}
            tabIndex={-1}
            className={
              "selecao-opcao" + (marcado ? " marcado" : "") + (i === foco ? " foco" : "")
            }
            onMouseEnter={() => !o.desabilitado && setFoco(i)}
            onClick={() => escolher(o)}
          >
            <span className="selecao-texto">{o.nome}</span>
            {marcado && <Icone nome="cheque" size={16} strokeWidth={2.2} />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      ref={ref}
      className={"selecao" + (pequeno ? " selecao-sm" : "") + (paraCima ? " para-cima" : "") + (aberto ? " aberta" : "") + (className ? " " + className : "")}
      style={style}
      // dentro de um <label>, o clique em qualquer parte reabriria a lista
      onClick={(e) => e.preventDefault()}
    >
      <button
        type="button"
        ref={botaoRef}
        className="selecao-botao"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={aberto ? id : undefined}
        aria-label={rotulo}
        onClick={() => setAberto(!aberto)}
        onKeyDown={tecla}
      >
        <span className={"selecao-texto" + (atual ? "" : " vazio")}>{atual?.nome ?? "Escolha uma opção"}</span>
        <Icone nome="setaBaixo" size={16} strokeWidth={2} />
      </button>

      {aberto && (celular ? (
        <div className="folha-fundo" onClick={() => setAberto(false)}>
          <div className="folha" onClick={(e) => e.stopPropagation()}>
            <div className="folha-alca" />
            {rotulo && <div className="menu-titulo">{rotulo}</div>}
            {lista}
          </div>
        </div>
      ) : lista)}
    </div>
  );
}
