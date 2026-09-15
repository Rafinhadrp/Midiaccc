/** Modelos de texto. Mexa aqui para mudar o que a pessoa recebe. */

const ASSINATURA = "Ministério de Multimídia";

export function assuntoAprovado() {
  return "Sua inscrição no Ministério de Multimídia foi aprovada";
}

export function assuntoRecusado() {
  return "Sobre sua inscrição no Ministério de Multimídia";
}

export function textoAprovado({ nome, funcoes, linkAcesso }) {
  const primeiro = nome.trim().split(/\s+/)[0];
  return `Olá, ${primeiro}! Tudo bem?

Sua inscrição no Ministério de Multimídia foi aprovada. Que alegria ter você com a gente.

Função: ${funcoes.join(", ")}
Primeiro treinamento: sábado, às 15h, na sala de mídia

Seu acesso ao sistema de escalas está liberado. Crie sua senha aqui:
${linkAcesso}

Qualquer dúvida, é só responder esta mensagem.
${ASSINATURA}`;
}

export function textoRecusado({ nome }) {
  const primeiro = nome.trim().split(/\s+/)[0];
  return `Olá, ${primeiro}! Tudo bem?

Obrigado por se inscrever no Ministério de Multimídia. Nesse momento não temos vaga aberta para a função que você escolheu, mas guardamos seu cadastro.

Assim que abrir uma nova turma, entramos em contato.

Que Deus abençoe.
${ASSINATURA}`;
}

/** Converte texto puro em HTML simples para o corpo do e-mail. */
export function paraHtml(texto) {
  const escapado = texto
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const comLinks = escapado.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" style="color:#0F1015">$1</a>'
  );
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#16181F;max-width:520px">
${comLinks.split("\n").map((l) => (l.trim() ? `<p style="margin:0 0 12px">${l}</p>` : "")).join("")}
</div>`;
}
