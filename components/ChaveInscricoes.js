"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Chave from "./Chave";
import { supabaseNavegador } from "@/lib/supabase/cliente";

export default function ChaveInscricoes({ abertasInicial, podeMudar }) {
  const router = useRouter();
  const [abertas, setAbertas] = useState(abertasInicial);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);

  async function alternar(novo) {
    if (!podeMudar) return;

    const anterior = abertas;
    setAbertas(novo);
    setOcupado(true);
    setErro(null);

    const { error } = await supabaseNavegador()
      .from("configuracoes")
      .update({ valor: novo, atualizado_em: new Date().toISOString() })
      .eq("chave", "inscricoes_abertas");

    setOcupado(false);

    if (error) {
      setAbertas(anterior);
      setErro("Não deu para salvar.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="chave-linha">
      <div className="chave-texto">
        <div className="chave-titulo">{abertas ? "Formulário aberto" : "Formulário fechado"}</div>
        <div className="chave-sub">
          {erro ?? (abertas
            ? "A página pública está recebendo inscrições"
            : "Quem entrar vê um aviso de que as inscrições estão encerradas")}
        </div>
      </div>
      <Chave
        ligada={abertas}
        onChange={alternar}
        ocupado={ocupado || !podeMudar}
        rotulo="Abrir ou fechar as inscrições"
      />
    </div>
  );
}
