"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import Icone from "./Icones";
import Menu from "./Menu";
import Confirmar from "./Confirmar";
import { supabaseNavegador } from "@/lib/supabase/cliente";

export default function ListaInscricoes({ inscricoes, funcoes, podeDecidir }) {
  const router = useRouter();
  const [lista, setLista] = useState(inscricoes);
  const [filtro, setFiltro] = useState("pendente");
  const [aberta, setAberta] = useState(null);
  const [modal, setModal] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [erro, setErro] = useState(null);

  // Segue os dados do servidor quando eles mudam
  const assinatura = JSON.stringify(inscricoes);
  const [vista, setVista] = useState(assinatura);
  if (vista !== assinatura) {
    setVista(assinatura);
    setLista(inscricoes);
  }

  const acharFuncao = (id) => funcoes.find((f) => f.id === id);
  const nomeFuncao = (id) => acharFuncao(id)?.nome ?? id;
  const visiveis = lista.filter((i) => (filtro === "todas" ? true : i.status === filtro));

  const contar = (status) =>
    status === "todas" ? lista.length : lista.filter((i) => i.status === status).length;

  /** Depois de decidir, a linha muda de estado sem recarregar a página. */
  function aplicarDecisao(id, novoStatus) {
    setLista((l) => l.map((i) => (i.id === id ? { ...i, status: novoStatus } : i)));
    setModal(null);
    router.refresh();
  }

  async function apagar(i) {
    const { error } = await supabaseNavegador().from("inscricoes").delete().eq("id", i.id);
    if (error) return { erro: error.message };
    setLista((l) => l.filter((x) => x.id !== i.id));
    setExcluindo(null);
    router.refresh();
    return {};
  }

  return (
    <>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {[["pendente", "Pendentes"], ["aprovado", "Aprovadas"], ["recusado", "Recusadas"], ["todas", "Todas"]].map(
          ([id, nome]) => (
            <button
              key={id}
              className={"pill pill-pick" + (filtro === id ? " pill-on" : "")}
              onClick={() => setFiltro(id)}
            >
              {nome}
              <span style={{ opacity: 0.6 }}>{contar(id)}</span>
            </button>
          )
        )}
      </div>

      <div className="card block" style={{ marginTop: 14 }}>
        {visiveis.length === 0 && (
          <div className="empty">
            <div style={{ fontWeight: 600, color: "var(--text)" }}>Nada por aqui</div>
            <div className="small" style={{ marginTop: 6 }}>
              Quando alguém se inscrever pela página pública, aparece nesta lista.
            </div>
          </div>
        )}

        {visiveis.map((i, idx) => (
          <div className="item" key={i.id} style={idx === 0 ? { borderTop: 0 } : undefined}>
            <div className="item-head">
              <Avatar nome={i.nome} foto={i.foto_url} size={46} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="item-name">
                  {i.nome}
                  {i.origem === "cadastro" && (
                    <span className="pill pill-off" style={{ marginLeft: 8, padding: "2px 8px", fontSize: 11 }}>
                      cadastro simples
                    </span>
                  )}
                </div>
                <div className="item-meta">{i.idade ? `${i.idade} anos · ` : ""}{i.telefone}</div>

                {i.funcoes.length > 0 && (
                  <div className="tags">
                    {i.funcoes.map((id) => {
                      const f = acharFuncao(id);
                      return (
                        <span className="fn-tag" key={id}>
                          <span className="fn-ico" style={{ color: f?.cor ?? "#999" }}>
                            <Icone nome={f?.icone ?? "ponto"} size={14} />
                          </span>
                          {nomeFuncao(id)}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span className={"pill pill-" + (i.status === "pendente" ? "wait" : i.status === "aprovado" ? "go" : "off")}>
                  <span className="dot" />{i.status}
                </span>

                {podeDecidir && (
                  <Menu
                    rotulo={`Opções de ${i.nome}`}
                    itens={[
                      {
                        nome: aberta === i.id ? "Fechar detalhes" : "Ver tudo",
                        icone: "busca",
                        onClick: () => setAberta(aberta === i.id ? null : i.id),
                      },
                      { separador: true },
                      {
                        nome: "Excluir inscrição",
                        icone: "lixeira",
                        perigo: true,
                        onClick: () => setExcluindo(i),
                      },
                    ]}
                  />
                )}
              </div>
            </div>

            {aberta === i.id && (
              <div style={{ marginTop: 14, paddingLeft: 59 }}>
                <div className="divider" style={{ marginBottom: 14 }} />
                {[
                  ["Experiência", i.experiencia || "não informou"],
                  ["Disponibilidade", i.disponibilidade || "não informou"],
                  ["E-mail", i.email],
                  ["Inscrição feita em", new Date(i.criado_em).toLocaleDateString("pt-BR")],
                ].map(([t, v]) => (
                  <div key={t} style={{ marginBottom: 11 }}>
                    <div className="small muted" style={{ fontWeight: 600 }}>{t}</div>
                    <div className="small" style={{ marginTop: 2 }}>{v}</div>
                  </div>
                ))}

                {podeDecidir && (
                  <button
                    className="btn btn-sm btn-linha"
                    style={{ color: "#B42318", borderColor: "#F3C9C4", marginTop: 4 }}
                    onClick={() => setExcluindo(i)}
                  >
                    <Icone nome="lixeira" size={15} /> Excluir inscrição
                  </button>
                )}
              </div>
            )}

            <div className="item-actions" style={{ paddingLeft: 59 }}>
              <button className="btn btn-sm" onClick={() => setAberta(aberta === i.id ? null : i.id)}>
                {aberta === i.id ? "Fechar" : "Ver tudo"}
              </button>
              {podeDecidir && i.status === "pendente" && (
                <>
                  <button
                    className="btn btn-sm btn-go btn-linha"
                    onClick={() => setModal({ inscricao: i, tipo: "aprovado" })}
                  >
                    <Icone nome="cheque" size={15} /> Aprovar
                  </button>
                  <button className="btn btn-sm" onClick={() => setModal({ inscricao: i, tipo: "recusado" })}>
                    Recusar
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <ModalDecisao
          {...modal}
          nomeFuncao={nomeFuncao}
          onFechar={() => setModal(null)}
          onPronto={(tipo) => aplicarDecisao(modal.inscricao.id, tipo)}
        />
      )}

      {excluindo && (
        <Confirmar
          titulo={`Excluir a inscrição de ${excluindo.nome.split(" ")[0]}`}
          descricao={
            excluindo.status === "aprovado"
              ? "Isso apaga só o registro da inscrição. A conta e o perfil da pessoa continuam ativos — para removê-los, use a aba Membros."
              : "O registro some da lista. A conta criada na inscrição continua existindo até alguém removê-la."
          }
          rotuloBotao="Excluir inscrição"
          onCancelar={() => setExcluindo(null)}
          onConfirmar={() => apagar(excluindo)}
        />
      )}
    </>
  );
}

function ModalDecisao({ inscricao, tipo, nomeFuncao, onFechar, onPronto }) {
  const [canal, setCanal] = useState("email");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);
  const [texto, setTexto] = useState(padrao(inscricao, tipo, nomeFuncao));

  async function confirmar() {
    setOcupado(true);
    setErro(null);
    try {
      const r = await fetch(`/api/inscricoes/${inscricao.id}/decisao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisao: tipo, canal, textoPersonalizado: texto }),
      });
      const dados = await r.json();

      if (!r.ok) { setErro(dados.erro || "Não deu certo."); setOcupado(false); return; }

      if (!dados.enviado) {
        // A decisão foi gravada: a lista precisa refletir isso mesmo
        // com a mensagem falhando, senão parece que nada aconteceu.
        setErro(`Decisão salva, mas a mensagem não saiu: ${dados.erroEnvio}`);
        setOcupado(false);
        return;
      }

      onPronto(tipo);
    } catch {
      setErro("Sem conexão com o servidor.");
      setOcupado(false);
    }
  }

  return (
    <div className="overlay" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <Avatar nome={inscricao.nome} foto={inscricao.foto_url} size={44} />
          <div>
            <h3 style={{ fontSize: 18 }}>
              {tipo === "aprovado" ? "Aprovar" : "Recusar"} {inscricao.nome.split(" ")[0]}
            </h3>
            <div className="small muted">A mensagem sai assim que você confirmar.</div>
          </div>
        </div>

        <div className="modal-body">
          {erro && (
            <>
              <div className="aviso aviso-erro">{erro}</div>
              <button
                className="btn btn-bloco"
                style={{ marginBottom: 14 }}
                onClick={() => onPronto(tipo)}
              >
                Fechar e atualizar a lista
              </button>
            </>
          )}

          <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
            {[["email", "E-mail"], ["whatsapp", "WhatsApp"]].map(([id, nome]) => (
              <button
                key={id}
                className={"pill pill-pick" + (canal === id ? " pill-on" : "")}
                style={{ padding: "9px 14px" }}
                onClick={() => setCanal(id)}
              >
                {nome}
              </button>
            ))}
            <span className="small muted">
              para {canal === "whatsapp" ? inscricao.telefone : inscricao.email}
            </span>
          </div>

          {canal === "whatsapp" && (
            <div className="small muted" style={{ marginBottom: 10 }}>
              Na API oficial da Meta o texto vem do template aprovado, então edições aqui
              valem só para o registro e para o envio pela Evolution.
            </div>
          )}

          <textarea className="msgbox" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onFechar} disabled={ocupado}>Cancelar</button>
          <button
            className={"btn " + (tipo === "aprovado" ? "btn-go" : "btn-primary")}
            onClick={confirmar}
            disabled={ocupado}
          >
            {ocupado ? "Enviando..." : tipo === "aprovado" ? "Aprovar e enviar" : "Recusar e enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function padrao(i, tipo, nomeFuncao) {
  const primeiro = i.nome.split(" ")[0];
  const funcoes = i.funcoes?.length ? i.funcoes.map(nomeFuncao).join(", ") : "a definir com a liderança";

  if (tipo === "aprovado") {
    return `Olá, ${primeiro}! Tudo bem?

Sua inscrição no Ministério de Multimídia foi aprovada. Que alegria ter você com a gente.

Função: ${funcoes}
Primeiro treinamento: sábado, às 15h, na sala de mídia

Seu acesso já está liberado. Entre com o e-mail e a senha que você criou no cadastro.

Qualquer dúvida, é só responder esta mensagem.
Ministério de Multimídia`;
  }

  return `Olá, ${primeiro}! Tudo bem?

Obrigado por se inscrever no Ministério de Multimídia. Nesse momento não temos vaga aberta, mas guardamos seu cadastro.

Assim que abrir uma nova turma, entramos em contato.

Que Deus abençoe.
Ministério de Multimídia`;
}
