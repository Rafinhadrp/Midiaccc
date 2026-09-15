"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarUpload from "./AvatarUpload";
import { supabaseNavegador } from "@/lib/supabase/cliente";

export default function FormPerfil({ perfil, funcoes }) {
  const router = useRouter();

  const [nome, setNome] = useState(perfil.nome);
  const [usuario, setUsuario] = useState(perfil.usuario);
  const [telefone, setTelefone] = useState(perfil.telefone);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [trocando, setTrocando] = useState(false);
  const [avisoSenha, setAvisoSenha] = useState(null);

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

  async function trocarSenha() {
    setAvisoSenha(null);

    if (senha.length < 8) {
      setAvisoSenha({ tipo: "erro", texto: "A senha precisa ter pelo menos 8 caracteres." });
      return;
    }
    if (senha !== confirma) {
      setAvisoSenha({ tipo: "erro", texto: "As duas senhas não são iguais." });
      return;
    }

    setTrocando(true);
    const { error } = await supabaseNavegador().auth.updateUser({ password: senha });
    setTrocando(false);

    if (error) {
      setAvisoSenha({ tipo: "erro", texto: "Não deu para trocar: " + error.message });
      return;
    }

    setSenha("");
    setConfirma("");
    setAvisoSenha({ tipo: "ok", texto: "Senha alterada. Ela já vale no próximo login." });
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
          <span className="small muted" style={{ fontWeight: 400, marginTop: 5, display: "block" }}>
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
          <span className="small muted" style={{ fontWeight: 400, marginTop: 5, display: "block" }}>
            O e-mail é o que identifica sua conta no login. Para trocar, fale com a liderança.
          </span>
        </label>

        {funcoes.length > 0 && (
          <div className="field">
            <span>Suas funções</span>
            <div className="tags" style={{ marginTop: 0 }}>
              {funcoes.map((f) => (
                <span className="pill" key={f.id}>
                  <span className="fdot" style={{ background: f.cor }} />
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

      <div className="card" style={{ padding: 22, marginTop: 16 }}>
        <h3 style={{ fontSize: 16.5, marginBottom: 6 }}>Trocar minha senha</h3>
        <div className="small muted" style={{ marginBottom: 16 }}>
          Você continua conectado neste aparelho depois de trocar.
        </div>

        {avisoSenha && <div className={"aviso aviso-" + avisoSenha.tipo}>{avisoSenha.texto}</div>}

        <label className="field">
          <span>Nova senha</span>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="new-password"
          />
        </label>

        <label className="field">
          <span>Repita a nova senha</span>
          <input
            type="password"
            value={confirma}
            onChange={(e) => setConfirma(e.target.value)}
            autoComplete="new-password"
            onKeyDown={(e) => e.key === "Enter" && trocarSenha()}
          />
        </label>

        <button className="btn btn-primary" onClick={trocarSenha} disabled={trocando || !senha}>
          {trocando ? "Trocando..." : "Trocar senha"}
        </button>
      </div>
    </>
  );
}
