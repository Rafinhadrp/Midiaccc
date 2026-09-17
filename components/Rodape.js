import Link from "next/link";

/**
 * Rodapé das páginas públicas. Fica sobre o fundo escuro.
 */
export default function Rodape() {
  const ano = new Date().getFullYear();

  return (
    <footer className="rodape">
      <div className="rodape-links">
        <Link href="/privacidade">Política de privacidade</Link>
        <span aria-hidden="true">·</span>
        <a href="mailto:multimidia@midia.rafinhadr.com.br">Fale com a gente</a>
      </div>
      <div className="rodape-copy">
        © {ano} Rafinhadr. Todos os direitos reservados.
      </div>
    </footer>
  );
}
