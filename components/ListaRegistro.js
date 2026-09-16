"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icone from "./Icones";
import Menu from "./Menu";
import Confirmar from "./Confirmar";
import { supabaseNavegador } from "@/lib/supabase/cliente";

const TIPOS = {
  aprovado: "Aprovação",
  recusado: "Recusa",
  redefinicao_senha: "Link de senha",
  senha_temporaria: "Senha temporária",
};

export default function ListaRegistro({ notificacoes, podeApagar }) {
  const router = useRouter();
  const [lista, setLista] = useState(notificacoes);
  const [filtro, setFiltro] = useState("todos");
  const [aberta, setAberta] = useState(null);
  const [limpando, setLimpando] = useState(false);
  const [erro, setErro] = useState(null);

  const visiveis = lista.filter((n) => {
    if (filtro === "todos") return true;
    if (filtro === "erro") return n.status === "erro";
    return n.canal === filtro;
  });

  async function apagar(n) {
    const anterior = lista;
    setLista((l) => l.filter((x) => x.id !== n.id));

    const { error } = await supabaseNavegador().from("notificacoes").delete().eq("id", n.id);
    if (error) { setLista(anterior); setErro(error.message); }
  }

  async function limparTudo() {
    const { error } = await supabaseNavegador()
      .from("notificacoes")
      .delete()
      .not("id", "is", null);

    if (error) return { erro: error.message };
    setLista([]);
    setLimpando(false);
    router.refresh();
    return {};
  }

  const erros = lista.filter((n) => n.status === "erro").length;

  return (
    <>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      {erros > 0 && (
        <div className="aviso aviso-erro">
          {erros} {erros === 1 ? "mensagem não saiu" : "mensagens não saíram"}. Filtre por
          &quot;com erro&quot; para ver o motivo.
        </div>
      )}

      <div className="linha-acao" style={{ flexWrap: "wrap", gap: 8 }}>
        <div className="cresce" style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {[
            ["todos", "Tudo"],
            ["email", "E-mail"],
            ["whatsapp", "WhatsApp"],
            ["erro", "Com erro"],
          ].map(([id, nome]) => (
            <button
              key={id}
              className={"pill pill-pick" + (filtro === id ? " pill-on" : "")}
              onClick={() => setFiltro(id)}
            >
              {nome}
            </button>
          ))}
        </div>

        {podeApagar && lista.length > 0 && (
          <button
            className="btn btn-sm btn-linha"
            style={{ color: "#B42318", borderColor: "#F3C9C4" }}
            onClick={() => setLimpando(true)}
          >
            <Icone nome="lixeira" size={15} /> Limpar tudo
          </button>
        )}
      </div>

      <div className="card block" style={{ marginTop: 14 }}>
        {visiveis.length === 0 && (
          <div className="empty">
            <div style={{ fontWeight: 600, color: "var(--text)" }}>Nada registrado</div>
            <div className="small" style={{ marginTop: 6 }}>
              Aqui aparece cada mensagem que o sistema enviou, com o resultado.
            </div>
          </div>
        )}

        {visiveis.map((n) => (
          <div className="item" key={n.id}>
            <div className="linha-acao" style={{ alignItems: "flex-start" }}>
              <div
                style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0, marginTop: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: n.status === "erro" ? "#FDECEA" : "var(--off-bg)",
                  color: n.status === "erro" ? "#B42318" : "var(--muted)",
                }}
              >
                <Icone nome={n.canal === "whatsapp" ? "transmissao" : "email"} size={17} />
              </div>

              <div className="cresce">
                <div className="item-name">{n.destino}</div>
                <div className="item-meta">
                  {TIPOS[n.tipo] ?? n.tipo} · {quando(n.criado_em)}
                </div>
                {n.erro && (
                  <div className="small" style={{ color: "#B42318", marginTop: 5 }}>{n.erro}</div>
                )}

                {aberta === n.id && n.conteudo && (
                  <div className="preview" style={{ marginTop: 10 }}>{n.conteudo}</div>
                )}

                {n.conteudo && (
                  <button
                    className="btn btn-sm"
                    style={{ marginTop: 10 }}
                    onClick={() => setAberta(aberta === n.id ? null : n.id)}
                  >
                    {aberta === n.id ? "Fechar" : "Ver mensagem"}
                  </button>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span className={"pill pill-" + (n.status === "enviado" ? "go" : "off")}>
                  <span className="dot" />{n.status}
                </span>
                {podeApagar && (
                  <Menu
                    rotulo="Opções do registro"
                    itens={[
                      { nome: "Apagar deste registro", icone: "lixeira", perigo: true, onClick: () => apagar(n) },
                    ]}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="small muted" style={{ marginTop: 14, textAlign: "center" }}>
        O registro se limpa sozinho: o que passa de 30 dias é removido automaticamente.
      </div>

      {limpando && (
        <Confirmar
          titulo="Limpar o registro inteiro"
          descricao="Todo o histórico de mensagens enviadas some. Isso não afeta as inscrições nem os membros."
          digitar="LIMPAR"
          rotuloBotao="Limpar tudo"
          onCancelar={() => setLimpando(false)}
          onConfirmar={limparTudo}
        />
      )}
    </>
  );
}

function quando(iso) {
  const d = new Date(iso);
  const minutos = Math.round((Date.now() - d.getTime()) / 60000);

  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  if (minutos < 1440) return `há ${Math.round(minutos / 60)} h`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
