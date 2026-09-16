"use client";

/** Chave liga/desliga. Verde quando ligada. */
export default function Chave({ ligada, onChange, rotulo, ocupado }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligada}
      aria-label={rotulo}
      className={"chave" + (ligada ? " on" : "")}
      onClick={() => onChange(!ligada)}
      disabled={ocupado}
    >
      <span className="bola" />
    </button>
  );
}
