"use client";
import { useEffect, useRef, useState } from "react";
import Icone from "./Icones";
import { TIPOS, montarConteudo, nomeArquivo } from "@/lib/qr-formatos";
import { supabaseNavegador } from "@/lib/supabase/cliente";
import Selecao from "./Selecao";

/* ============================================================
   Gerador de QR code
   A biblioteca qr-code-styling desenha e exporta; aqui ficam os
   controles e a montagem do conteúdo.
   ============================================================ */

const FORMAS_PONTO = [
  { id: "square", nome: "Quadrado" },
  { id: "rounded", nome: "Arredondado" },
  { id: "extra-rounded", nome: "Bem redondo" },
  { id: "dots", nome: "Bolinhas" },
  { id: "classy", nome: "Clássico" },
  { id: "classy-rounded", nome: "Clássico macio" },
];

const FORMAS_CANTO = [
  { id: "square", nome: "Quadrado" },
  { id: "extra-rounded", nome: "Arredondado" },
  { id: "dot", nome: "Círculo" },
];

const FORMAS_MIOLO = [
  { id: "square", nome: "Quadrado" },
  { id: "dot", nome: "Círculo" },
];

const PALETA = [
  "#0F1015", "#FF3B2F", "#2E6BFF", "#16A46B",
  "#8B5CF6", "#F79009", "#EC4899", "#0EA5E9",
];

const ESTILO_INICIAL = {
  formaPonto: "rounded",
  formaCanto: "extra-rounded",
  formaMiolo: "dot",
  corPontos: "#0F1015",
  corCantos: "#0F1015",
  corMiolo: "#FF3B2F",
  corFundo: "#FFFFFF",
  fundoTransparente: true,
  nivel: "Q",
  logo: null,
  tamanhoLogo: 0.32,
  margemLogo: 6,
};

export default function GeradorQr() {
  const [tipo, setTipo] = useState("link");
  const [dados, setDados] = useState({ seguranca: "wpa" });
  const [estilo, setEstilo] = useState(ESTILO_INICIAL);
  const [aba, setAba] = useState("forma");
  const [tamanhoPng, setTamanhoPng] = useState(1024);
  const [erro, setErro] = useState(null);

  const conteudo = montarConteudo(tipo, dados);

  const caixaRef = useRef(null);
  const qrRef = useRef(null);
  const LibRef = useRef(null);
  const [pronto, setPronto] = useState(false);

  const opcoes = montarOpcoes(conteudo, estilo);

  /* ---- cria o QR só no navegador ---- */
  useEffect(() => {
    let vivo = true;

    (async () => {
      const mod = await import("qr-code-styling");
      if (!vivo) return;

      LibRef.current = mod.default;
      qrRef.current = new mod.default({ width: 300, height: 300, ...opcoes });

      if (caixaRef.current) {
        caixaRef.current.innerHTML = "";
        qrRef.current.append(caixaRef.current);
      }
      setPronto(true);
    })();

    return () => { vivo = false; };
    // roda uma vez: as mudanças vão pelo update abaixo
  }, []);

  /* ---- repinta a cada mudança ---- */
  useEffect(() => {
    if (!pronto || !qrRef.current) return;
    qrRef.current.update(opcoes);
  }, [pronto, JSON.stringify(opcoes)]);

  function mudar(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }));
  }

  /* ---- download ---- */
  async function baixar(extensao) {
    if (!conteudo || !LibRef.current) return;
    setErro(null);

    try {
      const lado = extensao === "svg" ? 1024 : tamanhoPng;
      const temporario = new LibRef.current({
        width: lado,
        height: lado,
        ...montarOpcoes(conteudo, estilo),
      });

      await temporario.download({
        name: nomeArquivo(tipo, dados),
        extension: extensao,
      });
    } catch (e) {
      setErro("Não deu para baixar: " + (e?.message ?? e));
    }
  }

  async function escolherLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErro("A imagem do logo precisa ter menos de 2 MB.");
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
      setEstilo((s) => ({
        ...s,
        logo: leitor.result,
        // com logo no meio, o QR precisa de mais redundância
        nivel: s.nivel === "L" || s.nivel === "M" ? "H" : s.nivel,
      }));
    };
    leitor.readAsDataURL(file);
  }

  return (
    <div className="qr-layout">
      {/* ================= controles ================= */}
      <div className="qr-controles">
        {erro && <div className="aviso aviso-erro">{erro}</div>}

        <div className="card" style={{ padding: 18 }}>
          <div className="qr-secao">1. O que o código vai abrir</div>

          <div className="qr-tipos">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                className={"pill pill-pick" + (tipo === t.id ? " pill-on" : "")}
                onClick={() => { setTipo(t.id); setErro(null); }}
              >
                <Icone nome={t.icone} size={14} />
                {t.nome}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <CamposDoTipo
              tipo={tipo}
              dados={dados}
              mudar={mudar}
              setErro={setErro}
            />
          </div>
        </div>

        <div className="card" style={{ padding: 18, marginTop: 14 }}>
          <div className="qr-secao">2. Aparência</div>

          <div className="abas" style={{ marginTop: 12 }}>
            {[
              ["forma", "Forma"],
              ["cores", "Cores"],
              ["logo", "Logo"],
              ["nivel", "Nível"],
            ].map(([id, nome]) => (
              <button
                key={id}
                className={"aba" + (aba === id ? " on" : "")}
                onClick={() => setAba(id)}
              >
                {nome}
              </button>
            ))}
          </div>

          {aba === "forma" && (
            <>
              <Escolha
                rotulo="Corpo do código"
                opcoes={FORMAS_PONTO}
                valor={estilo.formaPonto}
                onEscolher={(v) => setEstilo((s) => ({ ...s, formaPonto: v }))}
              />
              <Escolha
                rotulo="Moldura dos cantos"
                opcoes={FORMAS_CANTO}
                valor={estilo.formaCanto}
                onEscolher={(v) => setEstilo((s) => ({ ...s, formaCanto: v }))}
              />
              <Escolha
                rotulo="Miolo dos cantos"
                opcoes={FORMAS_MIOLO}
                valor={estilo.formaMiolo}
                onEscolher={(v) => setEstilo((s) => ({ ...s, formaMiolo: v }))}
              />
            </>
          )}

          {aba === "cores" && (
            <>
              <Cor
                rotulo="Corpo"
                valor={estilo.corPontos}
                onMudar={(v) => setEstilo((s) => ({ ...s, corPontos: v }))}
              />
              <Cor
                rotulo="Moldura dos cantos"
                valor={estilo.corCantos}
                onMudar={(v) => setEstilo((s) => ({ ...s, corCantos: v }))}
              />
              <Cor
                rotulo="Miolo dos cantos"
                valor={estilo.corMiolo}
                onMudar={(v) => setEstilo((s) => ({ ...s, corMiolo: v }))}
              />

              <div className="divider" style={{ margin: "16px 0" }} />

              <label className="linha-acao" style={{ cursor: "pointer", marginBottom: 12 }}>
                <input
                  type="checkbox"
                  checked={estilo.fundoTransparente}
                  onChange={(e) =>
                    setEstilo((s) => ({ ...s, fundoTransparente: e.target.checked }))
                  }
                  style={{ width: 18, height: 18, accentColor: "var(--ink)" }}
                />
                <div className="cresce">
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Fundo transparente</div>
                  <div className="small muted">
                    Para usar sobre arte, vídeo ou fundo colorido. Vale só no PNG e no SVG.
                  </div>
                </div>
              </label>

              {!estilo.fundoTransparente && (
                <Cor
                  rotulo="Cor do fundo"
                  valor={estilo.corFundo}
                  onMudar={(v) => setEstilo((s) => ({ ...s, corFundo: v }))}
                />
              )}

              {estilo.fundoTransparente && estilo.corPontos === "#FFFFFF" && (
                <div className="aviso" style={{ background: "var(--wait-bg)", color: "var(--wait)" }}>
                  Código branco em fundo transparente some sobre arte clara. Confira
                  antes de usar.
                </div>
              )}
            </>
          )}

          {aba === "logo" && (
            <div style={{ marginTop: 14 }}>
              {estilo.logo ? (
                <>
                  <div className="qr-logo-atual">
                    <img src={estilo.logo} alt="" />
                    <div className="cresce">
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Logo aplicado</div>
                      <div className="small muted">
                        O nível de correção subiu para o código continuar legível.
                      </div>
                    </div>
                    <button
                      className="btn-ico"
                      onClick={() => setEstilo((s) => ({ ...s, logo: null }))}
                      aria-label="Remover logo"
                    >
                      <Icone nome="lixeira" size={16} />
                    </button>
                  </div>

                  <label className="field" style={{ marginTop: 14 }}>
                    <span>Tamanho do logo</span>
                    <input
                      type="range"
                      min="0.15" max="0.45" step="0.01"
                      value={estilo.tamanhoLogo}
                      onChange={(e) =>
                        setEstilo((s) => ({ ...s, tamanhoLogo: Number(e.target.value) }))
                      }
                      style={{ padding: 0, accentColor: "var(--ink)" }}
                    />
                    <span className="small muted" style={{ fontWeight: 400, marginTop: 6, display: "block" }}>
                      Quanto maior, mais difícil de ler. Teste com a câmera antes de publicar.
                    </span>
                  </label>
                </>
              ) : (
                <>
                  <label className="qr-upload">
                    <input type="file" accept="image/*" onChange={escolherLogo} hidden />
                    <Icone nome="mais" size={20} />
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>
                      Colocar um logo no meio
                    </div>
                    <div className="small muted">PNG ou JPG, até 2 MB</div>
                  </label>

                  <button
                    className="btn btn-bloco"
                    style={{ marginTop: 10 }}
                    onClick={() =>
                      setEstilo((s) => ({ ...s, logo: "/logo-branca.png", nivel: "H" }))
                    }
                  >
                    Usar a logo da Colheita
                  </button>
                </>
              )}
            </div>
          )}

          {aba === "nivel" && (
            <div style={{ marginTop: 14 }}>
              <div className="small muted" style={{ marginBottom: 14 }}>
                Quanto mais alto, mais o código aguenta sujeira, dobra e logo por cima —
                em troca, fica mais denso.
              </div>

              {[
                ["L", "Baixo", "recupera 7% — só para tela limpa"],
                ["M", "Médio", "recupera 15% — uso comum"],
                ["Q", "Alto", "recupera 25% — impressão e arte"],
                ["H", "Máximo", "recupera 30% — obrigatório com logo"],
              ].map(([id, nome, desc]) => (
                <button
                  key={id}
                  className={"qr-nivel" + (estilo.nivel === id ? " on" : "")}
                  onClick={() => setEstilo((s) => ({ ...s, nivel: id }))}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{nome}</div>
                    <div className="small muted">{desc}</div>
                  </div>
                  {estilo.nivel === id && <Icone nome="cheque" size={17} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="btn btn-bloco"
          style={{ marginTop: 14 }}
          onClick={() => setEstilo(ESTILO_INICIAL)}
        >
          Voltar ao padrão
        </button>
      </div>

      {/* ================= preview ================= */}
      <div className="qr-previa">
        <div className="card" style={{ padding: 22 }}>
          <div className="qr-secao" style={{ marginBottom: 14 }}>3. Como ficou</div>

          <div className={"qr-palco" + (estilo.fundoTransparente ? " xadrez" : "")}>
            <div ref={caixaRef} className={conteudo ? "" : "apagado"} />
            {!conteudo && (
              <div className="qr-palco-vazio">
                <Icone nome="alerta" size={22} />
                <div className="small" style={{ marginTop: 8 }}>
                  Preencha os campos ao lado
                </div>
              </div>
            )}
          </div>

          {conteudo && (
            <div className="qr-conteudo" title={conteudo}>
              {conteudo.length > 90 ? conteudo.slice(0, 90) + "..." : conteudo}
            </div>
          )}

          <div className="divider" style={{ margin: "18px 0 16px" }} />

          <div className="field">
            <span>Tamanho do PNG</span>
            <Selecao
              rotulo="Tamanho do PNG"
              value={tamanhoPng}
              onChange={(v) => setTamanhoPng(Number(v))}
              opcoes={[
                { valor: 512, nome: "512 px — redes sociais" },
                { valor: 1024, nome: "1024 px — uso geral" },
                { valor: 2048, nome: "2048 px — impressão" },
                { valor: 4096, nome: "4096 px — banner grande" },
              ]}
            />
          </div>

          <button
            className="btn btn-primary btn-bloco btn-linha"
            onClick={() => baixar("png")}
            disabled={!conteudo}
          >
            <Icone nome="cheque" size={16} /> Baixar PNG
          </button>

          <button
            className="btn btn-bloco btn-linha"
            style={{ marginTop: 9 }}
            onClick={() => baixar("svg")}
            disabled={!conteudo}
          >
            <Icone nome="editar" size={15} /> Baixar SVG
          </button>

          <div className="small muted" style={{ marginTop: 12, lineHeight: 1.5 }}>
            O SVG não perde qualidade em nenhum tamanho — é o certo para banner,
            camiseta e qualquer coisa impressa grande.
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div className="linha-acao" style={{ alignItems: "flex-start" }}>
            <div className="atalho-ico"><Icone nome="camera" size={17} /></div>
            <div className="cresce small muted">
              Antes de mandar imprimir, leia o código com dois celulares diferentes.
              Logo grande e cor clara demais são o que mais atrapalha.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Campos de cada tipo
   ============================================================ */

function CamposDoTipo({ tipo, dados, mudar, setErro }) {
  const [enviando, setEnviando] = useState(false);

  async function enviarArquivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErro("O arquivo precisa ter menos de 10 MB.");
      return;
    }

    setEnviando(true);
    setErro(null);

    const supabase = supabaseNavegador();
    const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
    const limpo = file.name
      .replace(/\.[^.]+$/, "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .slice(0, 40);

    const caminho = `${Date.now()}-${limpo || "arquivo"}.${ext}`;

    const { error } = await supabase.storage
      .from("arquivos")
      .upload(caminho, file, { contentType: file.type, upsert: false });

    setEnviando(false);

    if (error) {
      setErro("Não deu para enviar: " + error.message);
      return;
    }

    const url = supabase.storage.from("arquivos").getPublicUrl(caminho).data.publicUrl;
    mudar("arquivoUrl", url);
    mudar("arquivoNome", file.name);
  }

  switch (tipo) {
    case "link":
      return (
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Endereço</span>
          <input
            value={dados.url ?? ""}
            onChange={(e) => mudar("url", e.target.value)}
            placeholder="midia.rafinhadr.com.br/inscrever"
            inputMode="url"
          />
          <span className="small muted" style={{ fontWeight: 400, marginTop: 6, display: "block" }}>
            Se esquecer o https, ele é acrescentado sozinho.
          </span>
        </label>
      );

    case "texto":
      return (
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Texto</span>
          <textarea
            value={dados.texto ?? ""}
            onChange={(e) => mudar("texto", e.target.value)}
            placeholder="O que vai aparecer quando alguém ler o código"
            style={{ minHeight: 90 }}
          />
        </label>
      );

    case "arquivo":
      return (
        <>
          {dados.arquivoUrl ? (
            <div className="qr-logo-atual">
              <div className="atalho-ico"><Icone nome="email" size={17} /></div>
              <div className="cresce" style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, wordBreak: "break-word" }}>
                  {dados.arquivoNome}
                </div>
                <div className="small muted">Arquivo no ar</div>
              </div>
              <button
                className="btn-ico"
                onClick={() => { mudar("arquivoUrl", ""); mudar("arquivoNome", ""); }}
                aria-label="Trocar arquivo"
              >
                <Icone nome="lixeira" size={16} />
              </button>
            </div>
          ) : (
            <label className="qr-upload">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={enviarArquivo}
                hidden
                disabled={enviando}
              />
              <Icone nome="mais" size={20} />
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>
                {enviando ? "Enviando..." : "Escolher o arquivo"}
              </div>
              <div className="small muted">PDF ou imagem, até 10 MB</div>
            </label>
          )}

          <div className="small muted" style={{ marginTop: 12, lineHeight: 1.5 }}>
            O arquivo fica com endereço público: qualquer pessoa com o link abre.
            Não use para coisa que não pode circular.
          </div>
        </>
      );

    case "wifi":
      return (
        <>
          <label className="field">
            <span>Nome da rede</span>
            <input
              value={dados.ssid ?? ""}
              onChange={(e) => mudar("ssid", e.target.value)}
              placeholder="Colheita-Visitantes"
            />
          </label>

          <div className="field">
            <span>Segurança</span>
            <Selecao
              rotulo="Segurança da rede"
              value={dados.seguranca ?? "wpa"}
              onChange={(v) => mudar("seguranca", v)}
              opcoes={[
                { valor: "wpa", nome: "WPA / WPA2 / WPA3" },
                { valor: "wep", nome: "WEP (antigo)" },
                { valor: "nenhuma", nome: "Rede aberta" },
              ]}
            />
          </div>

          {dados.seguranca !== "nenhuma" && (
            <label className="field">
              <span>Senha</span>
              <input
                value={dados.senha ?? ""}
                onChange={(e) => mudar("senha", e.target.value)}
                autoComplete="off"
              />
            </label>
          )}

          <label className="linha-acao" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={Boolean(dados.oculta)}
              onChange={(e) => mudar("oculta", e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--ink)" }}
            />
            <div className="cresce small">Rede oculta</div>
          </label>

          <div className="small muted" style={{ marginTop: 12, lineHeight: 1.5 }}>
            A senha fica dentro do código, legível para quem souber decodificar.
            Serve para a rede de visitantes, não para a da secretaria.
          </div>
        </>
      );

    case "whatsapp":
      return (
        <>
          <label className="field">
            <span>Número com DDD</span>
            <input
              value={dados.numero ?? ""}
              onChange={(e) => mudar("numero", e.target.value)}
              placeholder="(16) 99999-0000"
              inputMode="tel"
            />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Mensagem já escrita <span className="muted" style={{ fontWeight: 400 }}>(opcional)</span></span>
            <textarea
              value={dados.mensagem ?? ""}
              onChange={(e) => mudar("mensagem", e.target.value)}
              placeholder="Olá! Vim pelo QR code da igreja."
            />
          </label>
        </>
      );

    case "email":
      return (
        <>
          <label className="field">
            <span>Para</span>
            <input
              value={dados.para ?? ""}
              onChange={(e) => mudar("para", e.target.value)}
              placeholder="multimidia@midia.rafinhadr.com.br"
              inputMode="email"
            />
          </label>
          <label className="field">
            <span>Assunto</span>
            <input value={dados.assunto ?? ""} onChange={(e) => mudar("assunto", e.target.value)} />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Mensagem</span>
            <textarea value={dados.corpo ?? ""} onChange={(e) => mudar("corpo", e.target.value)} />
          </label>
        </>
      );

    case "telefone":
      return (
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Número</span>
          <input
            value={dados.telefone ?? ""}
            onChange={(e) => mudar("telefone", e.target.value)}
            placeholder="(16) 3333-0000"
            inputMode="tel"
          />
        </label>
      );

    case "contato":
      return (
        <>
          <label className="field">
            <span>Nome</span>
            <input value={dados.nome ?? ""} onChange={(e) => mudar("nome", e.target.value)} />
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <label className="field" style={{ flex: 1 }}>
              <span>Organização</span>
              <input
                value={dados.organizacao ?? ""}
                onChange={(e) => mudar("organizacao", e.target.value)}
                placeholder="Colheita"
              />
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span>Cargo</span>
              <input value={dados.cargo ?? ""} onChange={(e) => mudar("cargo", e.target.value)} />
            </label>
          </div>
          <label className="field">
            <span>Telefone</span>
            <input
              value={dados.telefoneContato ?? ""}
              onChange={(e) => mudar("telefoneContato", e.target.value)}
              inputMode="tel"
            />
          </label>
          <label className="field">
            <span>E-mail</span>
            <input
              value={dados.emailContato ?? ""}
              onChange={(e) => mudar("emailContato", e.target.value)}
              inputMode="email"
            />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Site</span>
            <input value={dados.site ?? ""} onChange={(e) => mudar("site", e.target.value)} />
          </label>
        </>
      );

    case "pix":
      return (
        <>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Código copia e cola</span>
            <textarea
              value={dados.pixCopiaECola ?? ""}
              onChange={(e) => mudar("pixCopiaECola", e.target.value)}
              placeholder="Cole aqui o código que seu banco gerou"
              style={{ minHeight: 100, fontFamily: "ui-monospace, monospace", fontSize: 13 }}
            />
          </label>
          <div className="small muted" style={{ marginTop: 12, lineHeight: 1.5 }}>
            Gere o copia e cola no aplicativo do banco da igreja e cole aqui. Confira
            o valor e o recebedor lendo o código antes de divulgar.
          </div>
        </>
      );

    default:
      return null;
  }
}

/* ============================================================
   Controles pequenos
   ============================================================ */

function Escolha({ rotulo, opcoes, valor, onEscolher }) {
  return (
    <div className="field" style={{ marginTop: 16, marginBottom: 0 }}>
      <span>{rotulo}</span>
      <div className="qr-opcoes">
        {opcoes.map((o) => (
          <button
            key={o.id}
            className={"pill pill-pick" + (valor === o.id ? " pill-on" : "")}
            onClick={() => onEscolher(o.id)}
          >
            {o.nome}
          </button>
        ))}
      </div>
    </div>
  );
}

function Cor({ rotulo, valor, onMudar }) {
  return (
    <div className="field" style={{ marginTop: 14, marginBottom: 0 }}>
      <span>{rotulo}</span>
      <div className="qr-cores">
        {PALETA.map((c) => (
          <button
            key={c}
            className={"qr-cor" + (valor.toUpperCase() === c ? " on" : "")}
            style={{ background: c }}
            onClick={() => onMudar(c)}
            aria-label={`Cor ${c}`}
          />
        ))}
        <label className="qr-cor-livre" title="Escolher outra cor">
          <input type="color" value={valor} onChange={(e) => onMudar(e.target.value)} />
        </label>
      </div>
    </div>
  );
}

/* ============================================================
   Opções da biblioteca
   ============================================================ */

function montarOpcoes(conteudo, e) {
  return {
    type: "svg",
    // a biblioteca não aceita texto vazio; um espaço evita o erro
    // enquanto a pessoa ainda está preenchendo
    data: conteudo || " ",
    margin: 0,
    qrOptions: { errorCorrectionLevel: e.nivel },
    image: e.logo ?? undefined,
    imageOptions: {
      imageSize: e.tamanhoLogo,
      margin: e.margemLogo,
      hideBackgroundDots: true,
      crossOrigin: "anonymous",
    },
    dotsOptions: { type: e.formaPonto, color: e.corPontos },
    cornersSquareOptions: { type: e.formaCanto, color: e.corCantos },
    cornersDotOptions: { type: e.formaMiolo, color: e.corMiolo },
    backgroundOptions: {
      color: e.fundoTransparente ? "transparent" : e.corFundo,
    },
  };
}
