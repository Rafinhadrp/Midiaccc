import Link from "next/link";
import Marca from "@/components/Marca";
import Rodape from "@/components/Rodape";
import BuscaIngresso from "@/components/BuscaIngresso";

export const dynamic = "force-dynamic";

export default function MeuIngresso() {
  return (
    <div className="pub">
      <div className="pub-inner" style={{ maxWidth: 480 }}>
        <Marca />

        <h1>Meu ingresso</h1>
        <p className="lede">
          Digite o código que você recebeu na compra. Ele tem o formato MM-XXXXXX.
        </p>

        <div className="pub-card">
          <BuscaIngresso />
        </div>

        <div className="rodape-escuro">
          <Link href="/eventos">Ver eventos</Link>
        </div>

        <Rodape />
      </div>
    </div>
  );
}
