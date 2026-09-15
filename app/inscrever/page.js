import { supabaseAdmin } from "@/lib/supabase/admin";
import FormInscricao from "@/components/FormInscricao";

export const dynamic = "force-dynamic";

export default async function Inscrever() {
  const { data: funcoes } = await supabaseAdmin()
    .from("funcoes")
    .select("id, nome, cor")
    .order("ordem");

  return (
    <div className="pub">
      <div className="pub-inner">
        <div className="live"><span className="dot" />Inscrições abertas</div>
        <h1>Sirva na multimídia</h1>
        <p className="lede">
          Câmera, som, projeção, transmissão e fotografia. Não precisa saber nada ainda —
          a gente treina você do zero.
        </p>
        <div className="pub-card">
          <FormInscricao funcoes={funcoes ?? []} />
        </div>
      </div>
    </div>
  );
}
