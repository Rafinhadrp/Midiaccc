"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icone from "./Icones";

/**
 * Leitor de QR usando a câmera, direto no painel.
 *
 * Usa o BarcodeDetector, que já vem no Chrome (Android e desktop) e
 * no Edge. Onde ele não existe — Safari e iPhone, principalmente —
 * a tela explica que dá para usar a câmera normal do celular, que
 * lê o QR e abre o link sozinha, e oferece o campo para digitar o
 * código à mão.
 */
export default function LeitorQr() {
  const router = useRouter();
  const videoRef = useRef(null);
  const pararRef = useRef(null);

  const [suportado, setSuportado] = useState(null); // null enquanto verifica
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState(null);
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    setSuportado(typeof window !== "undefined" && "BarcodeDetector" in window);
    return () => pararRef.current?.();
  }, []);

  async function comecar() {
    setErro(null);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
    } catch (e) {
      setErro(
        e?.name === "NotAllowedError"
          ? "Você precisa permitir o acesso à câmera para ler o código."
          : "Não deu para abrir a câmera neste aparelho."
      );
      return;
    }

    const video = videoRef.current;
    video.srcObject = stream;
    await video.play().catch(() => {});
    setLendo(true);

    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    let ativo = true;

    pararRef.current = () => {
      ativo = false;
      stream.getTracks().forEach((t) => t.stop());
      setLendo(false);
    };

    async function procurar() {
      if (!ativo) return;

      try {
        const achados = await detector.detect(video);
        const valor = achados?.[0]?.rawValue;

        if (valor) {
          const destino = extrairCodigo(valor);
          if (destino) {
            pararRef.current?.();
            router.push(`/painel/checkin/${destino}`);
            return;
          }
        }
      } catch {
        // quadro ruim: tenta no próximo
      }

      requestAnimationFrame(procurar);
    }

    requestAnimationFrame(procurar);
  }

  function abrirCodigo() {
    const limpo = codigo.trim().toUpperCase().replace(/\s/g, "");
    if (limpo) router.push(`/painel/checkin/${encodeURIComponent(limpo)}`);
  }

  return (
    <>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      {suportado && (
        <div className="card" style={{ padding: 20, marginBottom: 14 }}>
          <div className={"leitor-palco" + (lendo ? " ativo" : "")}>
            <video ref={videoRef} playsInline muted />
            {lendo && <div className="leitor-mira" aria-hidden="true" />}
            {!lendo && (
              <div className="leitor-vazio">
                <Icone nome="camera" size={30} />
                <div className="small muted" style={{ marginTop: 10 }}>
                  A câmera abre aqui
                </div>
              </div>
            )}
          </div>

          <button
            className="btn btn-primary btn-bloco btn-linha"
            style={{ marginTop: 14, padding: 12 }}
            onClick={lendo ? () => pararRef.current?.() : comecar}
          >
            <Icone nome={lendo ? "fechar" : "camera"} size={16} />
            {lendo ? "Parar" : "Ler o QR code"}
          </button>

          {lendo && (
            <div className="small muted" style={{ textAlign: "center", marginTop: 10 }}>
              Aponte para o QR do ingresso. A tela abre sozinha.
            </div>
          )}
        </div>
      )}

      {suportado === false && (
        <div className="card" style={{ padding: 20, marginBottom: 14 }}>
          <div className="linha-acao" style={{ alignItems: "flex-start" }}>
            <div className="atalho-ico"><Icone nome="camera" size={18} /></div>
            <div className="cresce">
              <div className="item-name">Use a câmera do celular</div>
              <div className="small muted" style={{ marginTop: 5 }}>
                Este navegador não lê QR por dentro do site, mas o aplicativo de
                câmera do seu celular lê: aponte para o ingresso e toque no link
                que aparece. Ele abre esta mesma tela de conferência.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
          Ou digite o código
        </div>
        <div className="small muted" style={{ marginBottom: 14 }}>
          Serve quando o celular da pessoa está sem bateria ou a tela não lê.
        </div>

        <label className="field">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="MM-XXXXXX"
            onKeyDown={(e) => e.key === "Enter" && abrirCodigo()}
            style={{ letterSpacing: "0.08em", fontWeight: 600 }}
          />
        </label>

        <button
          className="btn btn-bloco btn-linha"
          onClick={abrirCodigo}
          disabled={!codigo.trim()}
        >
          <Icone nome="busca" size={15} /> Conferir
        </button>
      </div>
    </>
  );
}

/**
 * O QR guarda a URL inteira da conferência, mas alguém pode apontar
 * para outra coisa. Aceita a URL do sistema ou um código solto.
 */
function extrairCodigo(valor) {
  const texto = String(valor).trim();

  const naUrl = texto.match(/\/painel\/checkin\/([A-Za-z0-9-]+)/);
  if (naUrl) return naUrl[1].toUpperCase();

  const solto = texto.match(/^MM-[A-Z0-9]{6}$/i);
  if (solto) return texto.toUpperCase();

  return null;
}
