import { redirect } from "next/navigation";
import { perfilAtual, pode } from "@/lib/permissoes";
import Topo from "@/components/Topo";
import CheckinAutomatico from "@/components/CheckinAutomatico";

export const dynamic = "force-dynamic";

/**
 * Destino do QR quando o voluntário usa a câmera normal do celular.
 * A entrada é registrada assim que a tela abre.
 */
export default async function CheckinPorCodigo({ params }) {
  const { codigo } = await params;

  const perfil = await perfilAtual();
  if (!pode(perfil, "eventos:gerenciar")) redirect("/painel");

  return (
    <>
      <Topo titulo="Entrada" sub="Conferência do ingresso" />
      <div className="content" style={{ maxWidth: 460 }}>
        <CheckinAutomatico codigo={decodeURIComponent(codigo).toUpperCase()} />
      </div>
    </>
  );
}
