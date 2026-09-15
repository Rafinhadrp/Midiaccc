import { paraHtml } from "@/lib/mensagens";

/** Envia e-mail pela API da Resend. Retorna { ok, erro }. */
export async function enviarEmail({ para, assunto, texto }) {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, erro: "RESEND_API_KEY não configurada" };
  }

  const corpoEnvio = {
    from: process.env.EMAIL_REMETENTE,
    to: [para],
    subject: assunto,
    text: texto,
    html: paraHtml(texto),
  };

  // Quando a pessoa apertar Responder, a mensagem vai para este endereço.
  if (process.env.EMAIL_RESPOSTA) {
    corpoEnvio.reply_to = process.env.EMAIL_RESPOSTA;
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(corpoEnvio),
    });

    if (!r.ok) {
      const corpo = await r.text();
      return { ok: false, erro: `Resend ${r.status}: ${corpo.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: String(e?.message ?? e) };
  }
}