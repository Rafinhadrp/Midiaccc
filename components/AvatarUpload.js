"use client";
import { useRef, useState } from "react";
import Avatar from "./Avatar";
import { supabaseNavegador } from "@/lib/supabase/cliente";

/**
 * Sobe a foto direto para o bucket 'avatars' do Supabase Storage.
 * O caminho é sempre <uid>/arquivo, que é o que a policy de RLS exige.
 */
export default function AvatarUpload({ perfilId, nome, foto, size = 48, onTrocou }) {
  const ref = useRef(null);
  const [atual, setAtual] = useState(foto);
  const [subindo, setSubindo] = useState(false);

  async function escolher(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("A imagem precisa ter menos de 3 MB.");
      return;
    }

    setSubindo(true);
    const supabase = supabaseNavegador();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const caminho = `${perfilId}/perfil-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(caminho, file, { upsert: true, contentType: file.type });

    if (error) {
      setSubindo(false);
      alert("Não deu para enviar a foto: " + error.message);
      return;
    }

    const url = supabase.storage.from("avatars").getPublicUrl(caminho).data.publicUrl;
    await supabase.from("perfis").update({ foto_url: url }).eq("id", perfilId);

    setAtual(url);
    setSubindo(false);
    onTrocou?.(url);
  }

  return (
    <>
      <button
        className="av-edit"
        onClick={() => ref.current?.click()}
        disabled={subindo}
        title="Trocar foto de perfil"
        aria-label={`Trocar foto de ${nome}`}
      >
        <Avatar nome={nome} foto={atual} size={size} />
        <span className="cam" aria-hidden="true">{subindo ? "…" : "✎"}</span>
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={escolher}
      />
    </>
  );
}
