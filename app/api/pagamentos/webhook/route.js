import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { consultarPagamento, conferirAssinatura } from "@/lib/pagamentos/mercadopago";

/**
 * Notificação do Mercado Pago.
 *
 * Três cuidados, porque este endereço é público e qualquer pessoa
 * pode mandar uma mensagem fingindo ser o gateway:
 *
 *  1. A assinatura do cabeçalho x-signature é conferida, quando a
 *     chave secreta está configurada.
 *  2. O estado do pagamento vem de uma consulta à API do Mercado
 *     Pago, nunca do corpo da notificação.
 *  3. O valor pago é comparado com o valor do pedido, e o pedido
 *     só muda de pendente para pago uma vez.
 *
 * Tudo que chega fica registrado em webhooks_recebidos, inclusive
 * o que foi recusado.
 */
export async function POST(req) {
  const admin = supabaseAdmin();

  let corpo = {};
  try {
    corpo = await req.json();
  } catch {
    // Algumas notificações chegam só com parâmetros na URL
  }

  const url = new URL(req.url);
  const pagamentoId =
    corpo?.data?.id ??
    url.searchParams.get("data.id") ??
    url.searchParams.get("id") ??
    null;

  const tipo = corpo?.type ?? url.searchParams.get("topic") ?? null;

  // Só interessa notificação de pagamento
  if (tipo && tipo !== "payment") {
    return NextResponse.json({ ok: true, ignorado: tipo });
  }

  async function registrar(resultado, extra = {}) {
    await admin.from("webhooks_recebidos").insert({
      pagamento_id: pagamentoId ? String(pagamentoId) : null,
      corpo,
      resultado,
      ...extra,
    });
  }

  if (!pagamentoId) {
    await registrar("sem id de pagamento");
    return NextResponse.json({ ok: true });
  }

  // ---- 1. assinatura ----
  const assinaturaOk = conferirAssinatura({
    assinatura: req.headers.get("x-signature"),
    requestId: req.headers.get("x-request-id"),
    pagamentoId,
  });

  if (assinaturaOk === false) {
    await registrar("assinatura inválida", { assinatura_ok: false });
    // Responde 200 de propósito: não vale dar pista de que foi barrado
    return NextResponse.json({ ok: true });
  }

  // ---- 2. estado real, direto da fonte ----
  const pagamento = await consultarPagamento(pagamentoId);

  if (!pagamento.ok) {
    await registrar(`consulta falhou: ${pagamento.erro}`, { assinatura_ok: assinaturaOk });
    // 500 faz o Mercado Pago tentar de novo mais tarde
    return NextResponse.json({ erro: "falha na consulta" }, { status: 500 });
  }

  if (pagamento.status !== "approved") {
    await registrar("pagamento não aprovado", {
      assinatura_ok: assinaturaOk,
      status_lido: pagamento.status,
    });
    return NextResponse.json({ ok: true });
  }

  // ---- 3. confere o pedido ----
  const { data: pedido } = await admin
    .from("pedidos")
    .select("id, status, valor_centavos")
    .eq("id", pagamento.referencia)
    .maybeSingle();

  if (!pedido) {
    await registrar("pedido não encontrado", {
      assinatura_ok: assinaturaOk,
      status_lido: pagamento.status,
    });
    return NextResponse.json({ ok: true });
  }

  if (pedido.valor_centavos !== pagamento.centavos) {
    await registrar(
      `valor divergente: pedido ${pedido.valor_centavos}, pago ${pagamento.centavos}`,
      { assinatura_ok: assinaturaOk, status_lido: pagamento.status }
    );
    return NextResponse.json({ ok: true });
  }

  if (pedido.status === "pago") {
    await registrar("já estava pago", {
      assinatura_ok: assinaturaOk,
      status_lido: pagamento.status,
    });
    return NextResponse.json({ ok: true });
  }

  // O filtro por status pendente garante que a transição acontece
  // uma vez só, mesmo com duas notificações ao mesmo tempo
  const { data: atualizado } = await admin
    .from("pedidos")
    .update({ status: "pago", pago_em: new Date().toISOString() })
    .eq("id", pedido.id)
    .eq("status", "pendente")
    .select("id");

  await registrar(atualizado?.length ? "pedido confirmado" : "corrida: outro processo confirmou", {
    assinatura_ok: assinaturaOk,
    status_lido: pagamento.status,
  });

  return NextResponse.json({ ok: true });
}

/** O Mercado Pago às vezes testa o endereço com um GET. */
export async function GET() {
  return NextResponse.json({ ok: true });
}
