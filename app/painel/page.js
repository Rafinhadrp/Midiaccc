import Link from "next/link";
import { supabaseServidor } from "@/lib/supabase/server";
import { perfilAtual, pode } from "@/lib/permissoes";
import Avatar from "@/components/Avatar";
import Icone from "@/components/Icones";
import Topo from "@/components/Topo";

export const dynamic = "force-dynamic";

export default async function Painel() {
  const supabase = await supabaseServidor();
  const perfil = await perfilAtual();
  const hoje = new Date().toISOString().slice(0, 10);

  const [{ data: funcoes }, { data: eventos }, { data: pendentes }, { data: membros }, { data: notifs }] =
    await Promise.all([
      supabase.from("funcoes").select("*").order("ordem"),
      supabase
        .from("eventos")
        .select("*, escalacoes(funcao_id, status, perfis(id, nome, foto_url))")
        .gte("data", hoje)
        .order("data")
        .limit(4),
      pode(perfil, "inscricoes:ver")
        ? supabase.from("inscricoes").select("*").eq("status", "pendente").order("criado_em", { ascending: false })
        : Promise.resolve({ data: [] }),
      pode(perfil, "membros:ver")
        ? supabase.from("perfis").select("id, nome, foto_url").eq("ativo", true)
        : Promise.resolve({ data: [] }),
      pode(perfil, "inscricoes:ver")
        ? supabase.from("notificacoes").select("*").order("criado_em", { ascending: false }).limit(5)
        : Promise.resolve({ data: [] }),
    ]);

  const proximo = eventos?.[0];
  const vagas = (eventos ?? []).reduce(
    (s, ev) => s + (funcoes ?? []).filter((f) => !ev.escalacoes?.find((e) => e.funcao_id === f.id && e.perfis)).length,
    0
  );

  // Minhas escalas confirmadas ou pendentes nos próximos cultos
  const minhas = (eventos ?? []).flatMap((ev) =>
    (ev.escalacoes ?? [])
      .filter((e) => e.perfis?.id === perfil.id)
      .map((e) => ({ evento: ev, escalacao: e }))
  );

  return (
    <>
      <Topo titulo={`Olá, ${perfil.nome.split(" ")[0]}`} sub="Visão geral do ministério" />

      <div className="content">
        {proximo ? (
          <section className="hero">
            <div className="when">
              <div className="live"><span className="dot" />próximo culto</div>
              <div className="day">{proximo.data.slice(8, 10)}</div>
              <div className="mon">{formatarDia(proximo.data)}, {proximo.hora.slice(0, 5)}</div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3>{proximo.titulo}</h3>
              <div className="meta">Equipe escalada</div>
              <div className="crew">
                {(funcoes ?? []).map((f) => {
                  const e = proximo.escalacoes?.find((x) => x.funcao_id === f.id);
                  const p = e?.perfis;
                  return (
                    <div key={f.id} className={"crew-slot" + (p ? "" : " vago")}>
                      {p ? (
                        <Avatar nome={p.nome} foto={p.foto_url} size={30} ring={f.cor} />
                      ) : (
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%", border: "1px dashed #4A4D5C",
                          display: "flex", alignItems: "center", justifyContent: "center", color: "#4A4D5C",
                        }}>
                          <Icone nome={f.icone} size={14} />
                        </div>
                      )}
                      <div>
                        <div className="nm">{p ? p.nome.split(" ").slice(0, 2).join(" ") : "sem ninguém"}</div>
                        <div className="fn">
                          <span style={{ color: f.cor, display: "flex" }}>
                            <Icone nome={f.icone} size={12} />
                          </span>
                          {f.nome}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          <div className="card empty">
            <div style={{ fontWeight: 600, color: "var(--text)" }}>Nenhum culto programado</div>
            <div className="small" style={{ marginTop: 6 }}>
              Cadastre o próximo culto na aba Escalas para montar a equipe.
            </div>
          </div>
        )}

        {minhas.length > 0 && (
          <div className="card block">
            <div className="block-head">
              <div>
                <h3>Você está escalado</h3>
                <div className="sub">Confirme sua presença na aba Escalas</div>
              </div>
              <Link className="btn btn-sm" href="/painel/escalas">Ver escalas</Link>
            </div>
            {minhas.map(({ evento, escalacao }) => {
              const f = (funcoes ?? []).find((x) => x.id === escalacao.funcao_id);
              return (
                <div className="item" key={evento.id + escalacao.funcao_id}>
                  <div className="linha-acao">
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: (f?.cor ?? "#999") + "1A", color: f?.cor ?? "#999",
                    }}>
                      <Icone nome={f?.icone ?? "ponto"} size={18} />
                    </div>
                    <div className="cresce">
                      <div className="item-name">{evento.titulo}</div>
                      <div className="item-meta">
                        {evento.data.slice(8, 10)}/{evento.data.slice(5, 7)} às {evento.hora.slice(0, 5)} · {f?.nome}
                      </div>
                    </div>
                    <span className={"pill pill-" + (escalacao.status === "confirmado" ? "go" : "wait")}>
                      <span className="dot" />
                      {escalacao.status === "confirmado" ? "confirmado" : "aguardando"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="stats">
          <Cartao n={pendentes?.length ?? 0} l="Inscrições aguardando" />
          <Cartao n={membros?.length ?? 0} l="Pessoas no ministério" />
          <Cartao n={vagas} l="Funções sem ninguém" />
          <Cartao n={eventos?.length ?? 0} l="Cultos programados" />
        </div>

        {!!pendentes?.length && (
          <div className="card block">
            <div className="block-head">
              <div>
                <h3>Esperando sua resposta</h3>
                <div className="sub">Quem se inscreveu e ainda não sabe o resultado</div>
              </div>
              <Link className="btn btn-sm" href="/painel/inscricoes">Abrir</Link>
            </div>
            {pendentes.slice(0, 3).map((i) => (
              <div className="item" key={i.id}>
                <div className="item-head">
                  <Avatar nome={i.nome} foto={i.foto_url} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="item-name">{i.nome}</div>
                    <div className="item-meta">
                      {i.funcoes.map((f) => funcoes?.find((x) => x.id === f)?.nome ?? f).join(", ")}
                    </div>
                  </div>
                  <span className="pill pill-wait"><span className="dot" />pendente</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!!notifs?.length && (
          <div className="card block">
            <div className="block-head">
              <div>
                <h3>Mensagens enviadas</h3>
                <div className="sub">Registro de tudo que o sistema disparou</div>
              </div>
            </div>
            {notifs.map((n) => (
              <div className="item" key={n.id}>
                <div className="linha-acao">
                  <span style={{ color: "var(--muted)" }}>
                    <Icone nome={n.canal === "whatsapp" ? "transmissao" : "email"} size={17} />
                  </span>
                  <div className="cresce">
                    <div className="item-name">{n.destino}</div>
                    <div className="item-meta">
                      {n.canal === "whatsapp" ? "WhatsApp" : "E-mail"}, {n.tipo}
                      {n.erro ? ` — ${n.erro}` : ""}
                    </div>
                  </div>
                  <span className={"pill pill-" + (n.status === "enviado" ? "go" : "off")}>
                    <span className="dot" />{n.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Cartao({ n, l }) {
  return (
    <div className="card stat">
      <div className="n">{n}</div>
      <div className="l">{l}</div>
    </div>
  );
}

function formatarDia(iso) {
  const dias = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  return dias[new Date(iso + "T12:00:00").getDay()];
}
