import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/server";
import { perfilAtual } from "@/lib/permissoes";
import Shell from "@/components/Shell";

export default async function PainelLayout({ children }) {
  const perfil = await perfilAtual();

  if (!perfil) {
    // Tem conta mas ainda não tem perfil: inscrição não aprovada
    const supabase = await supabaseServidor();
    const { data: { user } } = await supabase.auth.getUser();
    redirect(user ? "/aguardando" : "/login");
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
