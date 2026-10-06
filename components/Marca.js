/**
 * Identidade da Colheita nas telas de entrada.
 * Usa a logo branca de /public, a mesma do painel, num selo de vidro.
 */
export default function Marca({ tamanho = 46, alinhamento = "left" }) {
  return (
    <div className={"marca" + (alinhamento === "center" ? " marca-centro" : "")}>
      <div
        className="marca-selo"
        style={{ width: tamanho, height: tamanho, borderRadius: tamanho * 0.3 }}
      >
        <img
          src="/logo-branca.png"
          alt=""
          style={{ width: tamanho * 0.74, height: tamanho * 0.74, objectFit: "contain" }}
        />
      </div>
      <div>
        <div className="marca-nome">Colheita</div>
        <div className="marca-sub">Ministério de Multimídia</div>
      </div>
    </div>
  );
}
