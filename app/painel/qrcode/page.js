import { redirect } from "next/navigation";
import { perfilAtual, pode } from "@/lib/permissoes";
import Topo from "@/components/Topo";
import GeradorQr from "@/components/GeradorQr";

export const dynamic = "force-dynamic";

export default async function PaginaQrCode() {
  const perfil = await perfilAtual();
  if (!pode(perfil, "qrcode:usar")) redirect("/painel");

  return (
    <>
      <Topo titulo="QR code" sub="Para vídeos, artes, cartazes e avisos" />
      <div className="content" style={{ maxWidth: 1080 }}>
        <GeradorQr />
      </div>
    </>
  );
}
