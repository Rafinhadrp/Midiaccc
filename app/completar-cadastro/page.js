import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import FormCompletar from "@/components/FormCompletar";

export const dynamic = "force-dynamic";

export default async function CompletarCadastro() {
  const supabase = await supabaseServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Quem já tem perfil ou já se inscreveu não passa por aqui
  const { data: perfil } = await supabase
    .from("perfis").select("id").eq("id", user.id).maybeSingle();
  if (perfil) redirect("/painel");

  const admin = supabaseAdmin();

  const { data: insc } = await admin
    .from("inscricoes").select("id").eq("email", user.email).maybeSingle();
  if (insc) redirect("/aguardando");

  const [{ data: funcoes }, { data: config }] = await Promise.all([
    admin.from("funcoes").select("id, nome, cor, icone").order("ordem"),
    admin.from("configuracoes").select("valor").eq("chave", "inscricoes_abertas").maybeSingle(),
  ]);

  const meta = user.user_metadata ?? {};

  return (
    <FormCompletar
      usuario={{
        email: user.email,
        nome: meta.full_name ?? meta.name ?? "",
        foto: meta.avatar_url ?? meta.picture ?? null,
      }}
      funcoes={funcoes ?? []}
      inscricoesAbertas={config?.valor !== false}
    />
  );
}
