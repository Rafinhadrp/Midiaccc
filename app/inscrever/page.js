import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import Marca from "@/components/Marca";
import FormInscricao from "@/components/FormInscricao";

export const dynamic = "force-dynamic";

export default async function Inscrever() {
  const admin = supabaseAdmin();

  const [{ data: funcoes }, { data: config }] = await Promise.all([
    admin.from("funcoes").select("id, nome, cor, icone").order("ordem"),
    admin.from("configuracoes").select("valor").eq("chave", "inscricoes_abertas").maybeSingle(),
  ]);

  const abertas = config?.valor !== false;

  return (
    <div className="pub">
      <div className="pub-inner">
        <Marca />

        {abertas ? (
          <>
            <div className="live"><span className="dot verde" />Inscrições abertas</div>
            <h1>Sirva na multimídia</h1>
            <p className="lede">
              Câmera, som, projeção, transmissão e fotografia. Não precisa saber nada ainda —
              a gente treina você do zero.
            </p>

            <div className="pub-card">
              <FormInscricao funcoes={funcoes ?? []} />
            </div>

            <div className="rodape-escuro">
              Já faz parte da equipe? <Link href="/login">Entrar</Link>
            </div>
          </>
        ) : (
          <>
            <div className="live"><span className="dot cinza" />Inscrições encerradas</div>
            <h1>Obrigado pelo interesse</h1>
            <p className="lede">
              As inscrições para o Ministério de Multimídia estão fechadas no momento.
              Fica a nossa gratidão por você querer servir com a gente.
            </p>

            <div className="pub-card">
              <div className="fechado">
                <div className="fechado-ico">
                  <img src="/logo-branca.png" alt="" />
                </div>
                <h3 style={{ fontSize: 20 }}>Volte em breve</h3>
                <p className="small muted" style={{ marginTop: 10 }}>
                  Assim que abrirmos uma turma nova, a Mídia CCC avisa pelos canais da
                  igreja e esta página volta a receber inscrições.
                </p>

                <div className="fechado-acoes">
                  <Link className="btn btn-primary btn-bloco" href="/login">
                    Entrar na minha conta
                  </Link>
                  <Link className="btn btn-bloco" href="/cadastrar">
                    Criar uma conta
                  </Link>
                </div>

                <p className="small muted" style={{ marginTop: 16 }}>
                  Criando sua conta agora, você já fica na lista e a liderança entra em
                  contato quando a próxima turma abrir.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
