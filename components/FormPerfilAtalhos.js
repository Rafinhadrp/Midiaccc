"use client";
import Link from "next/link";
import Icone from "./Icones";

/**
 * No celular a barra de baixo só comporta cinco abas, então
 * Registro e Acessos ficam acessíveis aqui, dentro do Perfil.
 */
export default function FormPerfilAtalhos({ permissoes }) {
  const itens = [
    { href: "/painel/registro", nome: "Registro de mensagens", sub: "O que o sistema enviou", ico: "email", perm: "inscricoes:ver" },
    { href: "/painel/acessos", nome: "Acessos", sub: "Papéis, permissões e funções", ico: "acessos", perm: "acessos:gerenciar" },
  ].filter((i) => permissoes.includes(i.perm));

  if (!itens.length) return null;

  return (
    <div className="card block so-celular" style={{ marginTop: 16 }}>
      <div className="block-head">
        <div>
          <h3>Administração</h3>
          <div className="sub">Disponível para o seu papel</div>
        </div>
      </div>
      {itens.map((i) => (
        <Link className="item atalho" key={i.href} href={i.href}>
          <div className="linha-acao">
            <div className="atalho-ico"><Icone nome={i.ico} size={18} /></div>
            <div className="cresce">
              <div className="item-name">{i.nome}</div>
              <div className="item-meta">{i.sub}</div>
            </div>
            <Icone nome="voltar" size={16} style={{ transform: "rotate(180deg)", color: "var(--muted)" }} />
          </div>
        </Link>
      ))}
    </div>
  );
}
