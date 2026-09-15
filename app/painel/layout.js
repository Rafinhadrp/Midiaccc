import { redirect } from "next/navigation";
import { perfilAtual } from "@/lib/permissoes";
import Shell from "@/components/Shell";

export default async function PainelLayout({ children }) {
  const perfil = await perfilAtual();

  if (!perfil) {
    redirect("/login");
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
