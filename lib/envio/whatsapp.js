/**
 * Dois caminhos, escolhidos por WHATSAPP_PROVIDER:
 *
 *  'cloud'     API oficial da Meta. Mensagem iniciada por você exige
 *              template aprovado. Não corre risco de banimento.
 *  'evolution' Evolution API self-hosted, lê o QR de um número comum.
 *              Manda texto livre, mas viola os termos do WhatsApp e
 *              o número pode ser bloqueado. Não use o número principal.
 *  'off'       Não envia nada por WhatsApp.
 */

/** Deixa o número no formato internacional só com dígitos. */
export function normalizarTelefone(bruto) {
  const digitos = String(bruto ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  const ddi = process.env.TELEFONE_DDI || "55";
  if (digitos.startsWith(ddi) && digitos.length >= 12) return digitos;
  return ddi + digitos;
}

export async function enviarWhatsapp({ para, texto, template, variaveis = [] }) {
  const provider = process.env.WHATSAPP_PROVIDER || "off";
  const numero = normalizarTelefone(para);

  if (provider === "off") return { ok: false, erro: "WhatsApp desligado (WHATSAPP_PROVIDER=off)" };
  if (!numero) return { ok: false, erro: "Telefone inválido" };

  try {
    if (provider === "cloud") return await viaCloud({ numero, template, variaveis });
    if (provider === "evolution") return await viaEvolution({ numero, texto });
    return { ok: false, erro: `WHATSAPP_PROVIDER desconhecido: ${provider}` };
  } catch (e) {
    return { ok: false, erro: String(e?.message ?? e) };
  }
}

async function viaCloud({ numero, template, variaveis }) {
  const { WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_TEMPLATE_IDIOMA } = process.env;
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    return { ok: false, erro: "WHATSAPP_TOKEN ou WHATSAPP_PHONE_ID não configurados" };
  }

  const r = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: numero,
      type: "template",
      template: {
        name: template,
        language: { code: WHATSAPP_TEMPLATE_IDIOMA || "pt_BR" },
        components: variaveis.length
          ? [{ type: "body", parameters: variaveis.map((v) => ({ type: "text", text: String(v) })) }]
          : [],
      },
    }),
  });

  if (!r.ok) {
    const corpo = await r.text();
    return { ok: false, erro: `Meta ${r.status}: ${corpo.slice(0, 300)}` };
  }
  return { ok: true };
}

async function viaEvolution({ numero, texto }) {
  const { EVOLUTION_URL, EVOLUTION_INSTANCE, EVOLUTION_APIKEY } = process.env;
  if (!EVOLUTION_URL || !EVOLUTION_INSTANCE) {
    return { ok: false, erro: "EVOLUTION_URL ou EVOLUTION_INSTANCE não configurados" };
  }

  const r = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVOLUTION_APIKEY ?? "" },
    body: JSON.stringify({ number: numero, text: texto }),
  });

  if (!r.ok) {
    const corpo = await r.text();
    return { ok: false, erro: `Evolution ${r.status}: ${corpo.slice(0, 300)}` };
  }
  return { ok: true };
}
