"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icone from "./Icones";
import { supabaseNavegador } from "@/lib/supabase/cliente";

export default function BotaoCheckin({ pedidoId }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);

  async function registrar() {
    setOcupado(true);
    setErro(null);

    const { error } = await supabaseNavegador()
      .from("pedidos")
      .update({ checkin_em: new Date().toISOString() })
      .eq("id", pedidoId)
      .is("checkin_em", null);

    setOcupado(false);
    if (error) setErro(error.message);
    else router.refresh();
  }

  return (
    <>
      {erro && <div className="aviso aviso-erro">{erro}</div>}
      <button className="btn btn-go btn-bloco btn-linha" onClick={registrar} disabled={ocupado}>
        <Icone nome="cheque" size={16} />
        {ocupado ? "Registrando..." : "Registrar entrada"}
      </button>
    </>
  );
}
