/**
 * Cada tipo de QR vira um texto com formato próprio.
 * O que muda entre eles é só como esse texto é montado.
 */

/** Escapa os caracteres que têm significado no formato do Wi-Fi. */
function escaparWifi(v = "") {
  return String(v).replace(/([\\;,":])/g, "\\$1");
}

/** Quebra de linha do vCard. */
function linhasVCard(linhas) {
  return linhas.filter(Boolean).join("\r\n");
}

export const TIPOS = [
  { id: "link", nome: "Link", icone: "computador" },
  { id: "texto", nome: "Texto", icone: "editar" },
  { id: "arquivo", nome: "PDF ou imagem", icone: "email" },
  { id: "wifi", nome: "Wi-Fi", icone: "transmissao" },
  { id: "whatsapp", nome: "WhatsApp", icone: "microfone" },
  { id: "email", nome: "E-mail", icone: "email" },
  { id: "telefone", nome: "Telefone", icone: "microfone" },
  { id: "contato", nome: "Contato", icone: "perfil" },
  { id: "pix", nome: "Pix copia e cola", icone: "cheque" },
];

/** Monta o conteúdo do QR a partir dos campos preenchidos. */
export function montarConteudo(tipo, d) {
  switch (tipo) {
    case "link": {
      const url = (d.url ?? "").trim();
      if (!url) return "";
      // sem esquema o leitor trata como texto e não abre nada
      return /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
    }

    case "texto":
      return (d.texto ?? "").trim();

    case "arquivo":
      return (d.arquivoUrl ?? "").trim();

    case "wifi": {
      const ssid = (d.ssid ?? "").trim();
      if (!ssid) return "";
      const seg = d.seguranca === "nenhuma" ? "nopass" : d.seguranca === "wep" ? "WEP" : "WPA";
      const partes = [
        `T:${seg}`,
        `S:${escaparWifi(ssid)}`,
        seg !== "nopass" ? `P:${escaparWifi(d.senha ?? "")}` : "",
        d.oculta ? "H:true" : "",
      ].filter(Boolean);
      return `WIFI:${partes.join(";")};;`;
    }

    case "whatsapp": {
      const num = String(d.numero ?? "").replace(/\D/g, "");
      if (!num) return "";
      const comDdi = num.length <= 11 ? `55${num}` : num;
      const texto = (d.mensagem ?? "").trim();
      return texto
        ? `https://wa.me/${comDdi}?text=${encodeURIComponent(texto)}`
        : `https://wa.me/${comDdi}`;
    }

    case "email": {
      const para = (d.para ?? "").trim();
      if (!para) return "";
      const params = new URLSearchParams();
      if (d.assunto?.trim()) params.set("subject", d.assunto.trim());
      if (d.corpo?.trim()) params.set("body", d.corpo.trim());
      const q = params.toString();
      return `mailto:${para}${q ? "?" + q : ""}`;
    }

    case "telefone": {
      const num = String(d.telefone ?? "").replace(/[^\d+]/g, "");
      return num ? `tel:${num}` : "";
    }

    case "contato": {
      const nome = (d.nome ?? "").trim();
      if (!nome) return "";
      const partes = nome.split(/\s+/);
      const sobrenome = partes.length > 1 ? partes.slice(1).join(" ") : "";
      const primeiro = partes[0];

      return linhasVCard([
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${sobrenome};${primeiro};;;`,
        `FN:${nome}`,
        d.organizacao?.trim() ? `ORG:${d.organizacao.trim()}` : "",
        d.cargo?.trim() ? `TITLE:${d.cargo.trim()}` : "",
        d.telefoneContato?.trim() ? `TEL;TYPE=CELL:${d.telefoneContato.trim()}` : "",
        d.emailContato?.trim() ? `EMAIL:${d.emailContato.trim()}` : "",
        d.site?.trim() ? `URL:${d.site.trim()}` : "",
        "END:VCARD",
      ]);
    }

    case "pix":
      return (d.pixCopiaECola ?? "").trim();

    default:
      return "";
  }
}

/** Nome sugerido para o arquivo baixado. */
export function nomeArquivo(tipo, d) {
  const base = {
    link: (d.url ?? "").replace(/^https?:\/\//, "").split("/")[0],
    wifi: d.ssid,
    contato: d.nome,
    whatsapp: "whatsapp",
    email: "email",
    telefone: "telefone",
    arquivo: d.arquivoNome,
    pix: "pix",
  }[tipo];

  const limpo = String(base ?? "qrcode")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return `qr-${limpo || "codigo"}`;
}
