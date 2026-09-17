import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { perfilAtual } from "@/lib/permissoes";
import Shell from "@/components/Shell";

export default async function PainelLayout({ children }) {
  const perfil = await perfilAtual();

  if (!perfil) {
    const supabase = await supabaseServidor();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Entrou pelo Google e ainda não completou o cadastro
    const { data: insc } = await supabase
      .from("inscricoes").select("id").eq("email", user.email).maybeSingle();

    redirect(insc ? "/aguardando" : "/completar-cadastro");
  }

  return (
    <Shell
      perfil={{
        id: perfil.id,
        nome: perfil.nome,
        foto_url: perfil.foto_url,
        papelNome: perfil.papelNome,
        permissoes: perfil.permissoes,
      }}
    >
      {children}
    </Shell>
  );
}
