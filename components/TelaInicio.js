import Link from "next/link";
import Marca from "./Marca";
import Rodape from "./Rodape";
import Icone from "./Icones";
import { MonitorAoVivo, Contagem } from "./Inicio";
import { descricaoFuncao } from "@/lib/funcoes-texto";

/**
 * Desenho da tela de início. Os dados vêm de app/page.js.
 */
export default function TelaInicio({ funcoes, abertas, membros, proximo }) {
  const lista = funcoes;
  const ctaHref = abertas ? "/inscrever" : "/cadastrar";
  const ctaTexto = abertas ? "Quero me inscrever" : "Criar minha conta";

  return (
    <div className="inicio">
      <header className="ini-topo">
        <Link href="/" className="ini-marca" aria-label="Mídia CCC, início">
          <Marca tamanho={40} />
        </Link>
        <nav className="ini-nav" aria-label="Seções">
          <a href="#funcoes">Funções</a>
          <a href="#como-entrar">Como entrar</a>
          <Link href="/eventos">Eventos</Link>
        </nav>
        <div className="ini-topo-acoes">
          <Link href="/login" className="btn btn-sm ini-entrar">Entrar</Link>
          <Link href={ctaHref} className="btn btn-primary btn-sm">Inscrever-se</Link>
        </div>
      </header>

      {/* ---------- abertura ---------- */}
      <section className="ini-abertura">
        <div className="ini-abertura-texto">
          <div className="ini-selo">
            <span className={"ini-led" + (abertas ? "" : " desligado")} />
            {abertas ? "Inscrições abertas" : "Inscrições encerradas no momento"}
          </div>
          <h1>
            Todo culto vai <span className="ini-ao-vivo">ao vivo</span>.
            <br />
            Alguém precisa estar <em>atrás das câmeras</em>.
          </h1>
          <p className="ini-lede">
            A Mídia CCC é o Ministério de Multimídia da Colheita. Somos a equipe que
            filma, mixa, projeta, transmite e fotografa cada culto, para que a
            mensagem chegue em quem está no templo e em quem está assistindo de casa.
          </p>
          <div className="ini-acoes">
            <Link href={ctaHref} className="btn btn-primary ini-cta">
              {ctaTexto}
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/login" className="btn ini-cta-2">Já sou da equipe</Link>
          </div>
          {!abertas && (
            <p className="ini-nota">
              Crie sua conta agora e a liderança te chama quando a próxima turma abrir.
            </p>
          )}
        </div>

        <MonitorAoVivo funcoes={lista} />
      </section>

      {/* ---------- faixa de números ---------- */}
      <section className="ini-faixa" aria-label="O ministério em números">
        <div className="ini-dado">
          <b>{membros ?? 0}</b>
          <span>pessoas servindo hoje</span>
        </div>
        <div className="ini-dado">
          <b>{lista.length}</b>
          <span>funções na equipe</span>
        </div>
        <div className="ini-dado ini-dado-largo">
          {proximo ? (
            <>
              <Contagem data={proximo.data} hora={proximo.hora} />
              <span>para o próximo culto · {proximo.titulo}</span>
            </>
          ) : (
            <>
              <b className="ini-mono">0h de experiência</b>
              <span>é o que você precisa para começar</span>
            </>
          )}
        </div>
      </section>

      {/* ---------- funções ---------- */}
      <section className="ini-secao" id="funcoes">
        <div className="ini-secao-topo">
          <span className="ini-rotulo">As funções</span>
          <h2>Escolha onde você quer servir</h2>
          <p>
            Ninguém precisa chegar sabendo. Você escolhe uma ou mais áreas na inscrição
            e a equipe treina você no próprio culto, ao lado de quem já faz.
          </p>
        </div>
        <div className="ini-funcoes">
          {lista.map((f, i) => (
            <article key={f.id} className="ini-funcao" style={{ "--c": f.cor }}>
              <div className="ini-funcao-topo">
                <span className="ini-funcao-ico"><Icone nome={f.icone} size={22} /></span>
                <span className="ini-canal">CAM {String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3>{f.nome}</h3>
              <p>{descricaoFuncao(f)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- como entrar ---------- */}
      <section className="ini-secao" id="como-entrar">
        <div className="ini-secao-topo">
          <span className="ini-rotulo">Como entrar</span>
          <h2>Da inscrição à sua primeira escala</h2>
        </div>
        <ol className="ini-passos">
          <li className="ini-passo">
            <span className="ini-passo-n">1</span>
            <h3>Faça sua inscrição</h3>
            <p>Conte quem você é, quando pode servir e quais funções te chamam a atenção. Leva uns dois minutos.</p>
          </li>
          <li className="ini-passo">
            <span className="ini-passo-n">2</span>
            <h3>A liderança responde</h3>
            <p>Você recebe a resposta por e-mail e WhatsApp. Aprovado, já pode entrar com o e-mail e a senha que criou.</p>
          </li>
          <li className="ini-passo">
            <span className="ini-passo-n">3</span>
            <h3>Entre na escala</h3>
            <p>Seu nome aparece nos cultos em que você foi escalado. É só confirmar a presença pelo celular.</p>
          </li>
        </ol>
      </section>

      {/* ---------- chamada final ---------- */}
      <section className="ini-final">
        <div className="ini-final-tally" aria-hidden="true">
          <span className="ini-led" /> REC
        </div>
        <h2>O próximo culto já tem um lugar esperando por você.</h2>
        <p>Venha servir com o que você vê e ouve.</p>
        <div className="ini-acoes ini-acoes-centro">
          <Link href={ctaHref} className="btn btn-primary ini-cta">
            {ctaTexto}
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/eventos" className="btn ini-cta-2">Ver eventos</Link>
        </div>
      </section>

      <div className="ini-rodape">
        <Rodape />
      </div>
    </div>
  );
}
