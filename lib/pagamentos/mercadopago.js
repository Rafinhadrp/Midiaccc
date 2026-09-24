import crypto from "crypto";

const BASE = "https://api.mercadopago.com";

function token() {
  const t = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!t) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
  return t;
}

/**
 * Cria uma cobrança Pix e devolve o código copia-e-cola e o QR.
 *
 * O valor vai em reais para a API, mas o sistema guarda centavos.
 * A conversão acontece aqui, num lugar só.
 */
export async function criarPix({ centavos, descricao, comprador, referencia, minutos = 30 }) {
  const expiraEm = new Date(Date.now() + minutos * 60 * 1000);

  const corpo = {
    transaction_amount: Number((centavos / 100).toFixed(2)),
    description: descricao,
    payment_method_id: "pix",
    external_reference: referencia,
    date_of_expiration: expiraEm.toISOString().replace("Z", "-00:00"),
    notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/pagamentos/webhook`,
    payer: {
      email: comprador.email,
      first_name: comprador.nome?.split(" ")[0] ?? "",
      last_name: comprador.nome?.split(" ").slice(1).join(" ") || "-",
    },
  };

  try {
    const r = await fetch(`${BASE}/v1/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token()}`,
        "Content-Type": "application/json",
        // Evita cobrança duplicada se a requisição for repetida
        "X-Idempotency-Key": referencia,
      },
      body: JSON.stringify(corpo),
    });

    const dados = await r.json();

    if (!r.ok) {
      const msg = dados?.message ?? dados?.error ?? `erro ${r.status}`;
      return { ok: false, erro: `Mercado Pago: ${msg}` };
    }

    const pix = dados?.point_of_interaction?.transaction_data ?? {};

    return {
      ok: true,
      pagamentoId: String(dados.id),
      copiaECola: pix.qr_code ?? null,
      qrBase64: pix.qr_code_base64 ?? null,
      expiraEm: expiraEm.toISOString(),
    };
  } catch (e) {
    return { ok: false, erro: String(e?.message ?? e) };
  }
}

/**
 * Pergunta ao Mercado Pago qual é o estado real de um pagamento.
 *
 * É esta consulta que decide se o pedido vira pago — nunca o
 * conteúdo da notificação, que qualquer um pode forjar.
 */
export async function consultarPagamento(pagamentoId) {
  try {
    const r = await fetch(`${BASE}/v1/payments/${pagamentoId}`, {
      headers: { Authorization: `Bearer ${token()}` },
      cache: "no-store",
    });

    if (!r.ok) return { ok: false, erro: `consulta falhou: ${r.status}` };

    const dados = await r.json();

    return {
      ok: true,
      status: dados.status,                    // approved, pending, rejected...
      referencia: dados.external_reference,
      centavos: Math.round((dados.transaction_amount ?? 0) * 100),
    };
  } catch (e) {
    return { ok: false, erro: String(e?.message ?? e) };
  }
}

/**
 * Confere a assinatura da notificação.
 *
 * O Mercado Pago manda um cabeçalho x-signature no formato
 * "ts=...,v1=...". O v1 é um HMAC do texto
 * "id:<id>;request-id:<request-id>;ts:<ts>;" com a chave secreta
 * do webhook, que fica no painel de desenvolvedor.
 *
 * Sem a chave configurada devolve null, e o webhook segue só com
 * a consulta à API — que já é a defesa principal.
 */
export function conferirAssinatura({ assinatura, requestId, pagamentoId }) {
  const segredo = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!segredo || !assinatura) return null;

  const partes = Object.fromEntries(
    assinatura.split(",").map((p) => p.trim().split("=").map((x) => x.trim()))
  );

  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  const manifesto = `id:${pagamentoId};request-id:${requestId ?? ""};ts:${ts};`;
  const esperado = crypto.createHmac("sha256", segredo).update(manifesto).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(v1));
  } catch {
    return false;
  }
}

/** Formata centavos para exibição: 1500 vira "R$ 15,00". */
export function emReais(centavos) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Código do ingresso, curto e fácil de ditar por telefone. */
export function gerarCodigo() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem I, O, 0, 1
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += letras[crypto.randomInt(letras.length)];
  }
  return `MM-${s}`;
}
