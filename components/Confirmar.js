"use client";
import { useState } from "react";
import Icone from "./Icones";

/**
 * Diálogo de confirmação para ações que não têm volta.
 * Quando `digitar` é passado, o botão só libera se a pessoa
 * escrever exatamente aquele texto.
 */
export default function Confirmar({
  titulo,
  descricao,
  digitar,
  rotuloBotao = "Excluir",
  onCancelar,
  onConfirmar,
}) {
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);

  const liberado = !digitar || texto.trim() === digitar;

  async function confirmar() {
    setOcupado(true);
    setErro(null);
    const r = await onConfirmar();
    if (r?.erro) {
      setErro(r.erro);
      setOcupado(false);
    }
  }

  return (
    <div className="overlay" onClick={onCancelar}>
      <div className="modal confirma" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="confirma-ico">
            <Icone nome="alerta" size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 17 }}>{titulo}</h3>
          </div>
        </div>

        <div className="modal-body">
          {erro && <div className="aviso aviso-erro">{erro}</div>}
          <div className="small muted" style={{ marginBottom: digitar ? 16 : 4 }}>
            {descricao}
          </div>

          {digitar && (
            <label className="field">
              <span>
                Digite <b style={{ color: "var(--text)" }}>{digitar}</b> para confirmar
              </span>
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                autoFocus
                autoComplete="off"
              />
            </label>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onCancelar} disabled={ocupado}>
            Cancelar
          </button>
          <button
            className="btn"
            style={{ background: "#B42318", borderColor: "#B42318", color: "#fff" }}
            onClick={confirmar}
            disabled={!liberado || ocupado}
          >
            {ocupado ? "Aguarde..." : rotuloBotao}
          </button>
        </div>
      </div>
    </div>
  );
}
