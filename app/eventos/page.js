import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import Marca from "@/components/Marca";
import Rodape from "@/components/Rodape";
import ListaEventos from "@/components/ListaEventos";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Eventos — Ministério de Multimídia",
};

export default async function Eventos() {
  const admin = supabaseAdmin();

  await admin.rpc("expirar_pedidos_vencidos");

  const hoje = new Date().toISOString().slice(0, 10);

  const { data: eventos } = await admin
    .from("eventos_pagos")
    .select("*")
    .or(`data_evento.gte.${hoje},data_evento.is.null`)
    .order("data_evento", { nullsFirst: false });

  // Conta as vagas já pagas de cada evento
  const comVagas = await Promise.all(
    (eventos ?? []).map(async (e) => {
      if (!e.limite_vagas) return { ...e, restantes: null };
      const { data: ocupadas } = await admin.rpc("vagas_ocupadas", { evento: e.id });
      return { ...e, restantes: e.limite_vagas - (ocupadas ?? 0) };
    })
  );

  return (
    <div className="pub">
      <div className="pub-inner" style={{ maxWidth: 620 }}>
        <Marca />

        <h1>Eventos</h1>
        <p className="lede">
          Garanta seu lugar pagando por Pix. A confirmação é na hora e o ingresso
          fica guardado no seu celular.
        </p>

        <ListaEventos eventos={comVagas} />

        <div className="rodape-escuro">
          Já tem ingresso? <Link href="/meu-ingresso">Ver meu ingresso</Link>
        </div>

        <Rodape />
      </div>
    </div>
  );
}
