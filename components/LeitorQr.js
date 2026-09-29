"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import Icone from "./Icones";

/**
 * Leitor de ingressos com a câmera.
 *
 * Lê o QR e registra a entrada na hora, sem sair da tela: o
 * resultado aparece por cima da câmera e em segundos ela volta a
 * ler, para a fila andar.
 *
 * A leitura usa o BarcodeDetector quando o navegador tem (Chrome no
 * Android é o caso comum, e é mais rápido) e cai no jsQR quando não
 * tem — que é o caso de todo navegador no iPhone, já que lá todos
 * usam o motor do Safari.
 */

const PAUSA_APOS_LEITURA = 2600; // ms que o resultado fica na tela

export default function LeitorQr() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const ocupadoRef = useRef(false);
  const ultimoRef = useRef({ codigo: null, quando: 0 });
  const wakeRef = useRef(null);

  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [codigoManual, setCodigoManual] = useState("");
  const [enviandoManual, setEnviandoManual] = useState(false);

  /* ---------------- registro da entrada ---------------- */

  const registrar = useCallback(async (codigo) => {
    try {
      const r = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const dados = await r.json();

      if (!r.ok) {
        setResultado({ resultado: "erro", mensagem: dados.erro ?? "Não deu certo." });
        return;
      }

      setResultado(dados);
      setHistorico((h) => [{ ...dados, id: Date.now() }, ...h].slice(0, 12));

      // vibração diferente para cada desfecho, para o voluntário
      // saber sem precisar olhar a tela
      if (navigator.vibrate) {
        if (dados.resultado === "liberado") navigator.vibrate(90);
        else if (dados.resultado === "repetido") navigator.vibrate([70, 70, 70]);
        else navigator.vibrate([200, 90, 200]);
      }
    } catch {
      setResultado({ resultado: "erro", mensagem: "Sem conexão. Tente de novo." });
    }
  }, []);

  /* ---------------- leitura ---------------- */

  const parar = useCallback(() => {
    cancelAnimationFrame(loopRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    wakeRef.current?.release?.().catch(() => {});
    wakeRef.current = null;
    setLendo(false);
  }, []);

  const comecar = useCallback(async () => {
    setErro(null);
    setResultado(null);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
    } catch (e) {
      setErro(
        e?.name === "NotAllowedError"
          ? "Você precisa permitir o acesso à câmera. No cadeado da barra de endereços dá para liberar."
          : e?.name === "NotFoundError"
            ? "Nenhuma câmera encontrada neste aparelho."
            : "Não deu para abrir a câmera. Em alguns navegadores isso só funciona em endereço https."
      );
      return;
    }

    streamRef.current = stream;
    const video = videoRef.current;
    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    await video.play().catch(() => {});
    setLendo(true);

    // mantém a tela acesa enquanto o voluntário está na porta
    try {
      wakeRef.current = await navigator.wakeLock?.request("screen");
    } catch {
      // nem todo navegador tem; não faz falta
    }

    let detector = null;
    if ("BarcodeDetector" in window) {
      try {
        detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      } catch {
        detector = null;
      }
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let ultimaAnalise = 0;

    async function quadro(agora) {
      if (!streamRef.current) return;
      loopRef.current = requestAnimationFrame(quadro);

      // analisar todo quadro esquenta o aparelho sem necessidade
      if (agora - ultimaAnalise < 120) return;
      ultimaAnalise = agora;

      if (ocupadoRef.current) return;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

      let bruto = null;

      try {
        if (detector) {
          const achados = await detector.detect(video);
          bruto = achados?.[0]?.rawValue ?? null;
        } else {
          const l = video.videoWidth;
          const a = video.videoHeight;
          if (!l || !a) return;

          // reduz o quadro: o jsQR fica bem mais rápido e continua lendo
          const escala = Math.min(1, 640 / Math.max(l, a));
          canvas.width = Math.round(l * escala);
          canvas.height = Math.round(a * escala);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          bruto = jsQR(img.data, img.width, img.height, {
            inversionAttempts: "dontInvert",
          })?.data ?? null;
        }
      } catch {
        return;
      }

      if (!bruto) return;

      const codigo = extrairCodigo(bruto);
      if (!codigo) return;

      // o mesmo ingresso fica alguns segundos na frente da câmera;
      // sem isso ele seria lido dezenas de vezes seguidas
      const { codigo: ultimo, quando } = ultimoRef.current;
      if (codigo === ultimo && Date.now() - quando < 6000) return;
      ultimoRef.current = { codigo, quando: Date.now() };

      ocupadoRef.current = true;
      await registrar(codigo);

      setTimeout(() => {
        ocupadoRef.current = false;
        setResultado(null);
      }, PAUSA_APOS_LEITURA);
    }

    loopRef.current = requestAnimationFrame(quadro);
  }, [registrar]);

  useEffect(() => () => parar(), [parar]);

  async function enviarManual() {
    const limpo = codigoManual.trim().toUpperCase().replace(/\s/g, "");
    if (!limpo) return;

    setEnviandoManual(true);
    await registrar(limpo);
    setEnviandoManual(false);
    setCodigoManual("");
  }

  return (
    <>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      <div className="card" style={{ padding: 18 }}>
        <div className={"leitor-palco" + (lendo ? " ativo" : "")}>
          <video ref={videoRef} playsInline muted />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {lendo && !resultado && <div className="leitor-mira" aria-hidden="true" />}

          {!lendo && !resultado && (
            <div className="leitor-vazio">
              <Icone nome="camera" size={30} />
              <div className="small muted" style={{ marginTop: 10 }}>
                A câmera abre aqui
              </div>
            </div>
          )}

          {resultado && <Veredito dados={resultado} />}
        </div>

        <button
          className={"btn btn-bloco btn-linha " + (lendo ? "" : "btn-primary")}
          style={{ marginTop: 14, padding: 13 }}
          onClick={lendo ? parar : comecar}
        >
          <Icone nome={lendo ? "fechar" : "camera"} size={16} />
          {lendo ? "Parar a câmera" : "Ler ingressos"}
        </button>

        {lendo && (
          <div className="small muted" style={{ textAlign: "center", marginTop: 10 }}>
            Aponte para o QR. A entrada é registrada sozinha e a câmera segue
            lendo o próximo.
          </div>
        )}
      </div>

      {historico.length > 0 && (
        <div className="card block" style={{ marginTop: 14 }}>
          <div className="block-head">
            <div>
              <h3>Lidos agora</h3>
              <div className="sub">{historico.length} nesta sessão</div>
            </div>
          </div>
          {historico.map((h) => (
            <div className="item" key={h.id}>
              <div className="linha-acao">
                <div className={"hist-ponto " + corDe(h.resultado)} aria-hidden="true" />
                <div className="cresce">
                  <div className="item-name">{h.pedido?.nome ?? h.codigo ?? "código desconhecido"}</div>
                  <div className="item-meta">
                    {h.pedido?.codigo ?? h.codigo ?? "—"} · {textoCurto(h.resultado)}
                  </div>
                </div>
                {h.pedido?.quantidade > 1 && (
                  <span className="pill pill-off">{h.pedido.quantidade} pessoas</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 18, marginTop: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
          Digitar o código
        </div>
        <div className="small muted" style={{ marginBottom: 14 }}>
          Para quando o celular da pessoa está sem bateria ou a tela não lê.
        </div>

        <label className="field">
          <input
            value={codigoManual}
            onChange={(e) => setCodigoManual(e.target.value.toUpperCase())}
            placeholder="MM-XXXXXX"
            onKeyDown={(e) => e.key === "Enter" && enviarManual()}
            style={{ letterSpacing: "0.08em", fontWeight: 600 }}
          />
        </label>

        <button
          className="btn btn-bloco btn-linha"
          onClick={enviarManual}
          disabled={!codigoManual.trim() || enviandoManual}
        >
          <Icone nome="cheque" size={15} />
          {enviandoManual ? "Registrando..." : "Registrar entrada"}
        </button>
      </div>
    </>
  );
}

/* ============================================================
   Veredito por cima da câmera
   ============================================================ */

function Veredito({ dados }) {
  const { resultado, pedido, mensagem, codigo } = dados;

  const conteudo = {
    liberado: {
      icone: "cheque",
      titulo: "Pode entrar",
      detalhe: pedido?.quantidade > 1 ? `${pedido.quantidade} pessoas` : null,
    },
    repetido: {
      icone: "alerta",
      titulo: "Já usado",
      detalhe: pedido?.checkin_em
        ? `Entrou às ${new Date(pedido.checkin_em).toLocaleTimeString("pt-BR", {
            hour: "2-digit", minute: "2-digit",
          })}`
        : "Confira com a pessoa",
    },
    nao_pago: { icone: "fechar", titulo: "Não pago", detalhe: "Não libere a entrada" },
    nao_existe: { icone: "fechar", titulo: "Código inválido", detalhe: codigo ?? null },
    erro: { icone: "fechar", titulo: "Deu problema", detalhe: mensagem ?? null },
  }[resultado] ?? { icone: "fechar", titulo: "Desconhecido", detalhe: null };

  return (
    <div className={"veredito " + corDe(resultado)} role="status">
      <Icone nome={conteudo.icone} size={44} strokeWidth={2.4} />
      <div className="veredito-titulo">{conteudo.titulo}</div>
      {pedido?.nome && <div className="veredito-nome">{pedido.nome}</div>}
      {conteudo.detalhe && <div className="veredito-detalhe">{conteudo.detalhe}</div>}
    </div>
  );
}

function corDe(resultado) {
  if (resultado === "liberado") return "ok";
  if (resultado === "repetido") return "aviso";
  return "ruim";
}

function textoCurto(resultado) {
  return {
    liberado: "liberado",
    repetido: "já tinha entrado",
    nao_pago: "não pago",
    nao_existe: "código inválido",
    erro: "erro",
  }[resultado] ?? resultado;
}

/**
 * O QR guarda a URL da conferência, mas a câmera pode pegar outra
 * coisa. Aceita a URL do sistema ou um código solto.
 */
function extrairCodigo(valor) {
  const texto = String(valor).trim();

  const naUrl = texto.match(/\/painel\/checkin\/([A-Za-z0-9-]+)/);
  if (naUrl) return naUrl[1].toUpperCase();

  if (/^MM-[A-Z0-9]{6}$/i.test(texto)) return texto.toUpperCase();

  return null;
}
