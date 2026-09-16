"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarUpload from "./AvatarUpload";
import CampoSenha from "./CampoSenha";
import Confirmar from "./Confirmar";
import Icone from "./Icones";
import { supabaseNavegador } from "@/lib/supabase/cliente";

export default function FormPerfil({ perfil, funcoes }) {
  const router = useRouter();

  const [nome, setNome] = useState(perfil.nome);
  const [usuario, setUsuario] = useState(perfil.usuario);
  const [telefone, setTelefone] = useState(perfil.telefone);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const [trocarSenha, setTrocarSenha] = useState(false);
  const [excluir, setExcluir] = useState(false);

  const usuarioValido = !usuario || /^[a-z0-9._]{3,20}$/.test(usuario);

  async function salvarDados() {
    setAviso(null);

    if (!nome.trim()) {
      setAviso({ tipo: "erro", texto: "O nome não pode ficar vazio." });
      return;
    }
    if (!usuarioValido) {
      setAviso({
        tipo: "erro",
        texto: "O nome de usuário aceita de 3 a 20 caracteres: letras minúsculas, números, ponto e underline.",
      });
      return;
    }

    setSalvando(true);
    const { error } = await supabaseNavegador()
      .from("perfis")
      .update({
        nome: nome.trim(),
        usuario: usuario.trim() || null,
        telefone: telefone.trim() || null,
      })
      .eq("id", perfil.id);
    setSalvando(false);

    if (error) {
      const jaExiste = error.code === "23505" || /duplicate|unique/i.test(error.message);
      setAviso({
        tipo: "erro",
        texto: jaExiste
          ? "Esse nome de usuário já está em uso. Escolha outro."
          : "Não deu para salvar: " + error.message,
      });
      return;
    }

    setAviso({ tipo: "ok", texto: "Dados salvos." });
    router.refresh();
  }

  async function apagarConta() {
    const r = await fetch("/api/perfil/excluir", { method: "POST" });
    const dados = await r.json();
    if (!r.ok) return { erro: dados.erro || "Não deu certo." };

    await supabaseNavegador().auth.signOut();
    router.push("/login");
    router.refresh();
    return {};
  }

  return (
    <>
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
          <AvatarUpload
            perfilId={perfil.id}
            nome={perfil.nome}
            foto={perfil.foto_url}
            size={72}
            onTrocou={() => router.refresh()}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{perfil.nome}</div>
            <div className="small muted">{perfil.papelNome}</div>
            <div className="small muted" style={{ marginTop: 3 }}>
              Toque na foto para trocar a imagem
            </div>
          </div>
        </div>

        {aviso && <div className={"aviso aviso-" + aviso.tipo}>{aviso.texto}</div>}

        <label className="field">
          <span>Nome completo</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>

        <label className="field">
          <span>Nome de usuário</span>
          <input
            value={usuario}
            onChange={(e) => setUsuario(e.target.value.toLowerCase().replace(/\s/g, ""))}
            placeholder="ex: rafael.camargo"
          />
          <span className="small muted" style={{ fontWeight: 400, marginTop: 6, display: "block" }}>
            De 3 a 20 caracteres: letras minúsculas, números, ponto e underline. Pode deixar vazio.
          </span>
        </label>

        <label className="field">
          <span>WhatsApp</span>
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} inputMode="tel" />
        </label>

        <label className="field">
          <span>E-mail</span>
          <input value={perfil.email} disabled style={{ opacity: 0.6 }} />
          <span className="small muted" style={{ fontWeight: 400, marginTop: 6, display: "block" }}>
            O e-mail identifica sua conta no login. Para trocar, fale com a liderança.
          </span>
        </label>

        {funcoes.length > 0 && (
          <div className="field">
            <span>Suas funções</span>
            <div className="tags" style={{ marginTop: 0 }}>
              {funcoes.map((f) => (
                <span className="fn-tag" key={f.id}>
                  <span className="fn-ico" style={{ color: f.cor }}>
                    <Icone nome={f.icone} size={14} />
                  </span>
                  {f.nome}
                </span>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-primary" onClick={salvarDados} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>

      {/* ---- segurança ---- */}
      <div className="card" style={{ padding: 22, marginTop: 16 }}>
        <div className="linha-acao">
          <div className="cresce">
            <h3 style={{ fontSize: 16.5 }}>Senha</h3>
            <div className="small muted" style={{ marginTop: 4 }}>
              Para trocar, você precisa informar a senha atual.
            </div>
          </div>
          <button className="btn btn-sm btn-linha" onClick={() => setTrocarSenha(true)}>
            <Icone nome="cadeado" size={15} /> Trocar senha
          </button>
        </div>
      </div>

      {/* ---- área de perigo ---- */}
      <div className="card perigo-card" style={{ padding: 22, marginTop: 16 }}>
        <div className="linha-acao">
          <div className="cresce">
            <h3 style={{ fontSize: 16.5 }}>Excluir minha conta</h3>
            <div className="small muted" style={{ marginTop: 4 }}>
              Remove seu acesso, seu perfil e suas escalas. Não tem como desfazer.
            </div>
          </div>
          <button
            className="btn btn-sm btn-linha"
            style={{ color: "#B42318", borderColor: "#F3C9C4" }}
            onClick={() => setExcluir(true)}
          >
            <Icone nome="lixeira" size={15} /> Excluir
          </button>
        </div>
      </div>

      {trocarSenha && (
        <ModalTrocarSenha
          email={perfil.email}
          onFechar={() => setTrocarSenha(false)}
        />
      )}

      {excluir && (
        <Confirmar
          titulo="Excluir sua conta"
          descricao="Você perde o acesso ao painel e sai de todas as escalas futuras. Para voltar, terá que se inscrever de novo e passar por aprovação."
          digitar="EXCLUIR"
          rotuloBotao="Excluir minha conta"
          onCancelar={() => setExcluir(false)}
          onConfirmar={apagarConta}
        />
      )}
    </>
  );
}

/** Troca de senha com verificação da senha atual. */
function ModalTrocarSenha({ email, onFechar }) {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState(null);

  const curta = nova.length > 0 && nova.length < 8;
  const diferentes = confirma.length > 0 && nova !== confirma;
  const valido = atual.length > 0 && nova.length >= 8 && nova === confirma;

  async function salvar() {
    setAviso(null);
    setOcupado(true);
    const supabase = supabaseNavegador();

    // Confere a senha atual antes de deixar trocar
    const { error: erroLogin } = await supabase.auth.signInWithPassword({
      email,
      password: atual,
    });

    if (erroLogin) {
      setOcupado(false);
      setAviso({ tipo: "erro", texto: "A senha atual não confere." });
      return;
    }

    if (nova === atual) {
      setOcupado(false);
      setAviso({ tipo: "erro", texto: "A senha nova precisa ser diferente da atual." });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: nova });
    setOcupado(false);

    if (error) {
      setAviso({ tipo: "erro", texto: "Não deu para trocar: " + error.message });
      return;
    }

    setAtual(""); setNova(""); setConfirma("");
    setAviso({ tipo: "ok", texto: "Senha alterada. Ela já vale no próximo login." });
  }

  return (
    <div className="overlay" onClick={onFechar}>
      <div className="modal confirma" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="confirma-ico" style={{ background: "var(--off-bg)", color: "var(--ink)" }}>
            <Icone nome="cadeado" size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 17 }}>Trocar senha</h3>
            <div className="small muted">Você continua conectado neste aparelho.</div>
          </div>
        </div>

        <div className="modal-body">
          {aviso && <div className={"aviso aviso-" + aviso.tipo}>{aviso.texto}</div>}

          <CampoSenha
            rotulo="Senha atual"
            valor={atual}
            onChange={setAtual}
            autoComplete="current-password"
            autoFocus
          />

          <div className="divider" style={{ margin: "4px 0 16px" }} />

          <CampoSenha
            rotulo="Nova senha"
            valor={nova}
            onChange={setNova}
            autoComplete="new-password"
            forca
            erro={curta ? "Faltam pelo menos 8 caracteres." : null}
            ajuda="Pelo menos 8 caracteres."
          />

          <CampoSenha
            rotulo="Repita a nova senha"
            valor={confirma}
            onChange={setConfirma}
            autoComplete="new-password"
            erro={diferentes ? "As duas senhas não são iguais." : null}
            onEnter={() => valido && salvar()}
          />
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onFechar} disabled={ocupado}>Fechar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={!valido || ocupado}>
            {ocupado ? "Trocando..." : "Trocar senha"}
          </button>
        </div>
      </div>
    </div>
  );
}
