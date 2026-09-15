"use client";
import { useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/cliente";

export default function MatrizAcessos({ papeis, permissoes, vinculosIniciais }) {
  const [vinculos, setVinculos] = useState(vinculosIniciais);
  const [erro, setErro] = useState(null);

  const tem = (papel, perm) =>
    vinculos.some((v) => v.papel_id === papel && v.permissao_id === perm);

  async function alternar(papel_id, permissao_id) {
    const supabase = supabaseNavegador();
    const marcado = tem(papel_id, permissao_id);
    const anterior = vinculos;

    setVinculos(
      marcado
        ? vinculos.filter((v) => !(v.papel_id === papel_id && v.permissao_id === permissao_id))
        : [...vinculos, { papel_id, permissao_id }]
    );

    const { error } = marcado
      ? await supabase.from("papel_permissoes").delete().eq("papel_id", papel_id).eq("permissao_id", permissao_id)
      : await supabase.from("papel_permissoes").insert({ papel_id, permissao_id });

    if (error) {
      setVinculos(anterior);
      setErro("Não deu para salvar: " + error.message);
    } else {
      setErro(null);
    }
  }

  return (
    <>
      {erro && <div className="aviso aviso-erro">{erro}</div>}

      <div className="card block" style={{ marginTop: 0 }}>
        <div className="block-head">
          <div>
            <h3>O que cada papel pode fazer</h3>
            <div className="sub">A mudança vale na hora para todo mundo daquele papel</div>
          </div>
        </div>
        <div className="matrix-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th>Permissão</th>
                {papeis.map((p) => <th key={p.id}>{p.nome}</th>)}
              </tr>
            </thead>
            <tbody>
              {permissoes.map((perm) => (
                <tr key={perm.id}>
                  <td>{perm.nome}</td>
                  {papeis.map((p) => (
                    <td key={p.id}>
                      <input
                        type="checkbox"
                        checked={tem(p.id, perm.id)}
                        onChange={() => alternar(p.id, perm.id)}
                        aria-label={`${perm.nome} para ${p.nome}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card block">
        <div className="block-head">
          <div>
            <h3>Sessões</h3>
            <div className="sub">Quem entra continua conectado sem digitar a senha de novo</div>
          </div>
        </div>
        <div className="item">
          <div className="small muted">
            O tempo de expiração é definido no painel do Supabase, em Authentication &gt; Sessions.
            Ajuste o &quot;time-box&quot; para 30 dias e todo mundo será obrigado a entrar de novo uma vez por mês.
          </div>
        </div>
      </div>
    </>
  );
}
