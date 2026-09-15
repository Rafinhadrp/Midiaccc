const CORES = ["#5B67E8", "#E8558B", "#18A07A", "#E8813A", "#7C5CE0", "#2E93E8", "#D4483B"];

export function corDoNome(nome = "") {
  let s = 0;
  for (let i = 0; i < nome.length; i++) s += nome.charCodeAt(i);
  return CORES[s % CORES.length];
}

export function iniciais(nome = "") {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase();
}

export default function Avatar({ nome, foto, size = 40, ring }) {
  const estilo = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.36),
    background: foto ? "#EEE" : corDoNome(nome),
  };
  if (ring) estilo["--ring"] = ring;
  return (
    <div className={"av" + (ring ? " av-ring" : "")} style={estilo} aria-hidden="true">
      {foto ? <img src={foto} alt="" /> : iniciais(nome)}
    </div>
  );
}
