export default function Topo({ titulo, sub, acao }) {
  return (
    <header className="topbar">
      <div>
        <h2>{titulo}</h2>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {acao}
    </header>
  );
}
