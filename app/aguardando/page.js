import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import SairSimples from "@/components/SairSimples";

export const dynamic = "force-dynamic";

/** Tela de quem tem conta mas ainda não foi aprovado pela liderança. */
export default async function Aguardando() {
  const supabase = await supabaseServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis").select("id").eq("id", user.id).maybeSingle();

  if (perfil) redirect("/painel");

  const { data: insc } = await supabase
    .from("inscricoes")
    .select("nome, status")
    .eq("email", user.email)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  const recusado = insc?.status === "recusado";
  const primeiro = insc?.nome?.trim().split(/\s+/)[0];

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ background: "#fff", borderRadius: 18, padding: 28, textAlign: "center" }}>
          <div
            className="mark"
            style={{
              width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px",
              background: recusado ? "var(--off-bg)" : "var(--wait-bg)",
              color: recusado ? "var(--muted)" : "var(--wait)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 700,
            }}
          >
            {recusado ? "—" : "..."}
          </div>

          <h2 style={{ fontSize: 21 }}>
            {recusado
              ? "Sua inscrição não foi aprovada"
              : primeiro ? `Quase lá, ${primeiro}` : "Inscrição em análise"}
          </h2>

          <p className="small muted" style={{ marginTop: 10 }}>
            {recusado
              ? "Não há vaga aberta para a função que você escolheu no momento. Seu cadastro ficou guardado e a liderança avisa quando abrir uma turma nova."
              : "Sua conta está criada e sua inscrição foi recebida. Assim que a liderança aprovar, seu acesso ao painel é liberado e você recebe um aviso."}
          </p>

          <div style={{ marginTop: 22 }}>
            <SairSimples />
          </div>
        </div>
      </div>
    </div>
  );
}
