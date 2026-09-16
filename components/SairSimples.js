"use client";
import { useRouter } from "next/navigation";
import { supabaseNavegador } from "@/lib/supabase/cliente";

export default function SairSimples() {
  const router = useRouter();

  async function sair() {
    await supabaseNavegador().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button className="btn btn-bloco" onClick={sair}>
      Sair da conta
    </button>
  );
}
