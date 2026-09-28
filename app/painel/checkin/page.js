import { redirect } from "next/navigation";
import Link from "next/link";
import { perfilAtual, pode } from "@/lib/permissoes";
import Topo from "@/components/Topo";
import LeitorQr from "@/components/LeitorQr";

export const dynamic = "force-dynamic";

export default async function Checkin() {
  const perfil = await perfilAtual();
  if (!pode(perfil, "eventos:gerenciar")) redirect("/painel");

  return (
    <>
      <Topo titulo="Entrada" sub="Leia o QR do ingresso para liberar" />

      <div className="content" style={{ maxWidth: 480 }}>
        <LeitorQr />

        <Link className="btn btn-bloco" href="/painel/eventos" style={{ marginTop: 14, textAlign: "center" }}>
          Voltar aos eventos
        </Link>
      </div>
    </>
  );
}
