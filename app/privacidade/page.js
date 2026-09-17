import Link from "next/link";
import Icone from "@/components/Icones";

export const metadata = {
  title: "Política de privacidade — Ministério de Multimídia",
  description: "Como o Ministério de Multimídia da Colheita trata os seus dados.",
};

/** Mude aqui quando revisar o texto. */
const ATUALIZADO_EM = "17 de setembro de 2026";
const CONTATO = "multimidia@midia.rafinhadr.com.br";

export default function Privacidade() {
  return (
    <div className="politica">
      <div className="politica-inner">
        <Link href="/inscrever" className="voltar">
          <Icone nome="voltar" size={16} /> Voltar
        </Link>

        <h1>Política de privacidade</h1>
        <p className="atualizado">Atualizada em {ATUALIZADO_EM}</p>

        <p>
          Esta página explica quais dados o sistema do Ministério de Multimídia da
          Colheita coleta, por que coleta e o que você pode fazer a respeito. O texto
          segue a Lei Geral de Proteção de Dados (Lei 13.709/2018).
        </p>

        <div className="quadro">
          <p style={{ marginBottom: 0 }}>
            <strong>Em uma frase:</strong> guardamos só o necessário para organizar
            as escalas do ministério, não vendemos nem compartilhamos seus dados com
            ninguém para fins comerciais, e você pode pedir a exclusão a qualquer momento.
          </p>
        </div>

        <h2>Quem é responsável</h2>
        <p>
          O responsável pelo tratamento dos dados é o Ministério de Multimídia da
          Colheita. Para qualquer assunto relacionado a esta política, incluindo
          pedidos de acesso ou exclusão, escreva para{" "}
          <a href={`mailto:${CONTATO}`}>{CONTATO}</a>.
        </p>

        <h2>Quais dados coletamos</h2>
        <p>Ao se inscrever ou criar uma conta, pedimos:</p>
        <ul>
          <li><strong>Nome completo</strong>, para identificar você nas escalas</li>
          <li><strong>E-mail</strong>, que serve como seu login e para avisos do sistema</li>
          <li><strong>WhatsApp</strong>, principal canal de contato da liderança</li>
          <li><strong>Data de nascimento</strong>, quando informada</li>
          <li><strong>Foto de perfil</strong>, opcional, para a equipe reconhecer você</li>
          <li><strong>Experiência e disponibilidade</strong>, para montar escalas que façam sentido</li>
          <li><strong>Funções de interesse</strong>, como câmera, som ou projeção</li>
        </ul>
        <p>
          Se você entrar com sua conta do Google, recebemos dele apenas seu nome,
          e-mail e foto de perfil. Não temos acesso à sua senha do Google nem a
          qualquer outro dado da sua conta.
        </p>
        <p>
          Sua senha, quando você cria uma, nunca é guardada em texto legível. Ela é
          transformada em um código irreversível, e nem a liderança nem quem
          desenvolveu o sistema consegue lê-la.
        </p>

        <h2>Para que usamos</h2>
        <ul>
          <li>Avaliar sua inscrição e responder se foi aprovada</li>
          <li>Montar as escalas dos cultos e avisar quem está escalado</li>
          <li>Enviar recados da liderança sobre reuniões, treinamentos e mudanças</li>
          <li>Dar a você acesso ao painel, com login e recuperação de senha</li>
        </ul>
        <p>
          Não usamos seus dados para publicidade, não fazemos perfilamento e não
          vendemos nem cedemos nada a terceiros com fins comerciais.
        </p>

        <h2>Com quem compartilhamos</h2>
        <p>
          Seus dados ficam visíveis para a liderança do ministério. Nome, foto e
          função aparecem também para os demais integrantes da equipe nas escalas,
          já que é preciso saber quem serve em cada culto. Telefone, e-mail e data de
          nascimento ficam restritos a quem tem permissão de administração.
        </p>
        <p>
          Para funcionar, o sistema usa serviços de terceiros que processam dados em
          nosso nome:
        </p>
        <ul>
          <li><strong>Supabase</strong> — banco de dados, autenticação e armazenamento das fotos</li>
          <li><strong>Vercel</strong> — hospedagem do site</li>
          <li><strong>Resend</strong> — envio dos e-mails do sistema</li>
          <li><strong>Google</strong> — apenas se você optar por entrar com a conta Google</li>
        </ul>
        <p>
          Esses serviços podem armazenar dados fora do Brasil. Todos possuem políticas
          próprias de proteção de dados e contratos que os obrigam a tratá-los somente
          conforme nossas instruções.
        </p>

        <h2>Por quanto tempo guardamos</h2>
        <ul>
          <li>
            <strong>Enquanto você faz parte do ministério</strong>, mantemos seu
            cadastro ativo
          </li>
          <li>
            <strong>Inscrições recusadas</strong> ficam guardadas para que a liderança
            possa chamar você em uma turma futura, até que você peça a remoção
          </li>
          <li>
            <strong>Registro de mensagens enviadas</strong> é apagado automaticamente
            depois de 30 dias
          </li>
          <li>
            <strong>Ao excluir sua conta</strong>, seus dados de acesso e perfil são
            removidos em definitivo
          </li>
        </ul>

        <h2>Seus direitos</h2>
        <p>A LGPD garante que você pode, a qualquer momento:</p>
        <ul>
          <li>Saber quais dados temos sobre você</li>
          <li>Corrigir informações erradas ou desatualizadas</li>
          <li>Pedir a exclusão dos seus dados</li>
          <li>Retirar seu consentimento e sair do ministério</li>
          <li>Pedir uma cópia dos seus dados</li>
        </ul>
        <p>
          Boa parte disso você mesmo resolve na página <strong>Meu perfil</strong>,
          dentro do painel: lá dá para editar seus dados, trocar a senha e excluir a
          conta. Para o que não estiver lá, escreva para{" "}
          <a href={`mailto:${CONTATO}`}>{CONTATO}</a> e respondemos em até 15 dias.
        </p>

        <h2>Menores de 18 anos</h2>
        <p>
          O ministério recebe adolescentes. Quando o inscrito tem menos de 18 anos, o
          cadastro deve ser feito com o conhecimento e a autorização dos pais ou
          responsáveis, e a liderança pode solicitar essa confirmação antes de aprovar.
          Responsáveis podem pedir acesso ou exclusão dos dados do menor pelo e-mail de
          contato, a qualquer momento.
        </p>

        <h2>Segurança</h2>
        <p>
          O acesso ao sistema é protegido por senha, a conexão é criptografada e as
          permissões são verificadas no banco de dados, não apenas na tela. Cada pessoa
          vê somente o que o seu papel no ministério permite. Ainda assim, nenhum
          sistema é totalmente imune: se identificarmos algum incidente que possa
          afetar você, avisaremos.
        </p>

        <h2>Cookies</h2>
        <p>
          Usamos apenas os cookies necessários para manter você conectado entre uma
          visita e outra. Não há cookies de publicidade nem rastreamento de
          comportamento.
        </p>

        <h2>Mudanças nesta política</h2>
        <p>
          Se algo mudar, atualizamos esta página e a data no topo. Alterações
          relevantes serão comunicadas pelos canais do ministério.
        </p>

        <div className="rodape-politica">
          © {new Date().getFullYear()} Rafinhadr. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}
