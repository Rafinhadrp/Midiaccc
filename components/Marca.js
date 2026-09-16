/**
 * Identidade da Colheita nas telas de entrada.
 * Usa a logo branca de /public, a mesma do painel.
 */
export default function Marca({ tamanho = 46, alinhamento = "left" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        justifyContent: alinhamento === "center" ? "center" : "flex-start",
        marginBottom: 22,
      }}
    >
      <div
        style={{
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho * 0.28,
          background: "#1B1D26",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <img
          src="/logo-branca.png"
          alt=""
          style={{ width: tamanho * 0.72, height: tamanho * 0.72, objectFit: "contain" }}
        />
      </div>
      <div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
          Colheita
        </div>
        <div style={{ color: "#8E91A3", fontSize: 12.5 }}>Ministério de Multimídia</div>
      </div>
    </div>
  );
}
