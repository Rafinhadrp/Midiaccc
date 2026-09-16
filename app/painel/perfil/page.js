import { perfilAtual } from "@/lib/permissoes";
import { supabaseServidor } from "@/lib/supabase/server";
import Topo from "@/components/Topo";
import FormPerfil from "@/components/FormPerfil";

export const dynamic = "force-dynamic";

export default async function PaginaPerfil() {
  const perfil = await perfilAtual();
  const supabase = await supabaseServidor();
  const { data: funcoes } = await supabase.from("funcoes").select("*").order("ordem");

  const minhas = (funcoes ?? []).filter((f) => perfil.funcoes.includes(f.id));

  return (
    <>
      <Topo titulo="Meu perfil" sub="Seus dados, sua senha e sua conta" />
      <div className="content">
        <FormPerfil
          perfil={{
            id: perfil.id,
            nome: perfil.nome,
            usuario: perfil.usuario ?? "",
            email: perfil.email,
            telefone: perfil.telefone ?? "",
            foto_url: perfil.foto_url,
            papelNome: perfil.papelNome,
          }}
          funcoes={minhas}
        />
      </div>
    </>
  );
}
