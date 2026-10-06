import { supabaseAdmin } from "@/lib/supabase/admin";
import TelaInicio from "@/components/TelaInicio";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mídia CCC — Ministério de Multimídia",
  description:
    "Câmera, som, projeção, transmissão e fotografia. Conheça a equipe que faz cada culto da Colheita acontecer e inscreva-se para servir.",
};

/**
 * Tela de início para quem ainda não entrou.
 * Quem já está logado é levado direto ao painel pelo middleware.
 */
export default async function Inicio() {
  const admin = supabaseAdmin();
  const hoje = new Date().toISOString().slice(0, 10);

  const [{ data: funcoes }, { data: config }, { count: membros }, { data: proximos }] =
    await Promise.all([
      admin.from("funcoes").select("id, nome, cor, icone").order("ordem"),
      admin.from("configuracoes").select("valor").eq("chave", "inscricoes_abertas").maybeSingle(),
      admin.from("perfis").select("id", { count: "exact", head: true }).eq("ativo", true),
      admin.from("eventos").select("titulo, data, hora").gte("data", hoje).order("data").order("hora").limit(1),
    ]);

  return (
    <TelaInicio
      funcoes={funcoes ?? []}
      abertas={config?.valor !== false}
      membros={membros ?? 0}
      proximo={proximos?.[0] ?? null}
    />
  );
}
