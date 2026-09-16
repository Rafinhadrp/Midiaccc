"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AvatarUpload from "./AvatarUpload";
import Avatar from "./Avatar";
import Icone from "./Icones";
import { supabaseNavegador } from "@/lib/supabase/cliente";

const ABAS = [
  { href: "/painel",            nome: "Painel",     ico: "painel",     perm: null },
  { href: "/painel/inscricoes", nome: "Inscrições", ico: "inscricoes", perm: "inscricoes:ver" },
  { href: "/painel/escalas",    nome: "Escalas",    ico: "escalas",    perm: "escalas:ver" },
  { href: "/painel/membros",    nome: "Membros",    ico: "membros",    perm: "membros:ver" },
  { href: "/painel/registro",   nome: "Registro",   ico: "email",      perm: "inscricoes:ver", soDesktop: true },
  { href: "/painel/acessos",    nome: "Acessos",    ico: "acessos",    perm: "acessos:gerenciar", soDesktop: true },
  { href: "/painel/perfil",     nome: "Perfil",     ico: "perfil",     perm: null, soMobile: true },
];

export default function Shell({ perfil, children }) {
  const caminho = usePathname();
  const router = useRouter();
  const abas = ABAS.filter((a) => !a.perm || perfil.permissoes.includes(a.perm));

  async function sair() {
    await supabaseNavegador().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <div className="shell">
        <aside className="rail">
          <div className="brand">
            <div className="mark" aria-hidden="true">
              <img src="/logo-branca.png" alt="" style={{ width: 30, height: 30, objectFit: "contain" }} />
            </div>
            <div>
              <h3>Colheita</h3>
              <p>Ministério de Multimídia</p>
            </div>
          </div>

          <nav>
            {abas.filter((a) => !a.soMobile).map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={"navitem" + (caminho === a.href ? " on" : "")}
              >
                <span className="ico"><Icone nome={a.ico} size={18} /></span>
                {a.nome}
              </Link>
            ))}
          </nav>

          <div className="rail-foot">
            <div className={"me" + (caminho === "/painel/perfil" ? " me-on" : "")}>
              <AvatarUpload
                perfilId={perfil.id}
                nome={perfil.nome}
                foto={perfil.foto_url}
                size={38}
                onTrocou={() => router.refresh()}
              />
              <Link href="/painel/perfil" className="me-link">
                <div className="who">{perfil.nome}</div>
                <div className="role">{perfil.papelNome}</div>
              </Link>
            </div>
            <button className="linkout btn-linha" style={{ justifyContent: "center" }} onClick={sair}>
              <Icone nome="sair" size={15} /> Sair da conta
            </button>
          </div>
        </aside>

        <div className="main">{children}</div>
      </div>

      {/* No celular a barra fica com 5 itens; Registro e Acessos entram no Perfil */}
      <nav className="tabbar">
        {abas.filter((a) => !a.soDesktop).map((a) => (
          <Link key={a.href} href={a.href} className={"tab" + (caminho === a.href ? " on" : "")}>
            <span className="ico">
              {a.href === "/painel/perfil" ? (
                <Avatar nome={perfil.nome} foto={perfil.foto_url} size={20} />
              ) : (
                <Icone nome={a.ico} size={19} />
              )}
            </span>
            {a.nome}
          </Link>
        ))}
      </nav>
    </>
  );
}
