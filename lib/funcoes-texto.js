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
  corte: "Escolhe qual câmera vai ao ar em cada momento. É quem conta a história do culto em tempo real.",
  camera: "Enquadra o louvor, a pregação e as reações da igreja. Câmera firme, olho atento e muita comunicação com o corte.",
  som: "Cuida para que cada voz e cada instrumento chegue limpo, no templo e na transmissão.",
  projecao: "Coloca no telão as letras, os versículos e os avisos, sempre um passo antes de quem está cantando.",
  transmissao: "Leva o culto para quem não pode estar no templo: abre a live, acompanha o sinal e conversa com quem assiste.",
  foto: "Registra o que acontece no culto e nos eventos. São essas imagens que contam a história da igreja.",
  arte: "Cria as artes dos cultos, eventos e redes sociais, dando cara para tudo o que a igreja comunica.",
  luz: "Desenha a luz do palco para cada momento do culto, do louvor à ministração.",
  outro: "Faz parte da equipe que serve em cada culto para a mensagem chegar mais longe.",
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
