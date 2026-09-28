import QRCode from "qrcode";

/**
 * Gera o QR como data URL, no servidor.
 *
 * Fazer isso no servidor evita carregar biblioteca de imagem no
 * navegador de quem só quer ver o próprio ingresso.
 */
export async function gerarQr(texto, { tamanho = 320 } = {}) {
  try {
    return await QRCode.toDataURL(texto, {
      width: tamanho,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0F1015", light: "#FFFFFF" },
    });
  } catch {
    return null;
  }
}
