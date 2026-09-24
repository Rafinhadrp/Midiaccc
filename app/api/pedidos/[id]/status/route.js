import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { consultarPagamento } from "@/lib/pagamentos/mercadopago";

/**
 * A tela de pagamento consulta aqui de tempos em tempos.
 *
 * Normalmente o webhook chega antes e o status já está pago. Esta
 * rota também pergunta ao Mercado Pago por conta própria, para o
 * caso do webhook falhar — assim a pessoa não fica olhando uma
 * tela parada por causa de um problema que não é dela.
 */
export async function GET(_req, { params }) {
  const { id } = await params;
  const admin = supabaseAdmin();

  const { data: pedido } = await admin
    .from("pedidos")
    .select("id, status, codigo, pagamento_id, expira_em")
    .eq("id", id)
    .maybeSingle();

  if (!pedido) return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 });

  if (pedido.status === "pago") {
    return NextResponse.json({ status: "pago", codigo: pedido.codigo });
  }

  if (pedido.status === "pendente" && pedido.pagamento_id) {
    const r = await consultarPagamento(pedido.pagamento_id);

    if (r.ok && r.status === "approved") {
      await admin
        .from("pedidos")
        .update({ status: "pago", pago_em: new Date().toISOString() })
        .eq("id", id)
        .eq("status", "pendente");

      return NextResponse.json({ status: "pago", codigo: pedido.codigo });
    }

    if (r.ok && ["cancelled", "rejected", "expired"].includes(r.status)) {
      await admin.from("pedidos").update({ status: "expirado" }).eq("id", id);
      return NextResponse.json({ status: "expirado" });
    }
  }

  const vencido = pedido.expira_em && new Date(pedido.expira_em) < new Date();
  if (vencido && pedido.status === "pendente") {
    await admin.from("pedidos").update({ status: "expirado" }).eq("id", id);
    return NextResponse.json({ status: "expirado" });
  }

  return NextResponse.json({ status: pedido.status });
}
