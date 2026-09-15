import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import FormNovaSenha from "@/components/FormNovaSenha";

export const dynamic = "force-dynamic";

export default async function RedefinirSenha() {
  const supabase = await supabaseServidor();
  const { data: { user } } = await supabase.auth.getUser();

  // Sem sessão, a pessoa chegou aqui sem passar pelo link do e-mail
  if (!user) {
    redirect("/login?erro=" + encodeURIComponent("Abra o link que enviamos por e-mail."));
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome")
    .eq("id", user.id)
    .maybeSingle();

  return <FormNovaSenha nome={perfil?.nome ?? ""} email={user.email} />;
}
