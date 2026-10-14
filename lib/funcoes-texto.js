/**
 * Textos e tipo visual de cada função, usados na tela de início.
 * As funções vêm do banco, então o reconhecimento é pelo nome e pelo ícone.
 */

const TIPOS = [
  { tipo: "corte", chaves: ["corte", "switcher", "direção", "direcao"] },
  { tipo: "camera", chaves: ["câmera", "camera", "filmagem", "cinegrafia"] },
  { tipo: "som", chaves: ["som", "áudio", "audio", "mesa"] },
  { tipo: "projecao", chaves: ["projeção", "projecao", "letra", "telão", "telao"] },
  { tipo: "transmissao", chaves: ["transmissão", "transmissao", "live", "stream"] },
  { tipo: "foto", chaves: ["foto", "vídeo", "video", "fotografia"] },
  { tipo: "arte", chaves: ["arte", "design", "social", "mídia social"] },
  { tipo: "luz", chaves: ["luz", "iluminação", "iluminacao"] },
];

const TEXTOS = {
  corte: "Escolhe, em tempo real, qual câmera vai ao ar em cada momento do culto.",
  camera: "Enquadra o louvor, a pregação e a igreja, combinando cada movimento com quem está no corte.",
  som: "Cuida para que cada voz e cada instrumento chegue limpo, no templo e na transmissão.",
  projecao: "Coloca no telão as letras, os versículos e os avisos, sempre um passo antes de quem está cantando.",
  transmissao: "Leva o culto para quem não pode estar no templo: abre a live, acompanha o sinal e conversa com quem assiste.",
  foto: "Fotografa e filma os cultos e os eventos da igreja.",
  arte: "Cria as artes dos cultos, dos eventos e das redes sociais da igreja.",
  luz: "Ajusta a luz do palco em cada parte do culto, do louvor à ministração.",
  outro: "Faz parte da equipe que serve nos cultos.",
};

// O nome manda; o ícone e o id só desempatam quando o nome não diz nada
export function tipoFuncao(f) {
  for (const alvo of [f?.nome, `${f?.icone ?? ""} ${f?.id ?? ""}`]) {
    const texto = (alvo ?? "").toLowerCase();
    const achado = TIPOS.find((t) => t.chaves.some((c) => texto.includes(c)));
    if (achado) return achado.tipo;
  }
  return "outro";
}

export function descricaoFuncao(f) {
  return TEXTOS[tipoFuncao(f)];
}
