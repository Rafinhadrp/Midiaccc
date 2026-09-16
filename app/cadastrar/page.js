import { Suspense } from "react";
import FormCadastro from "@/components/FormCadastro";

export const dynamic = "force-dynamic";

export default function Cadastrar() {
  return (
    <Suspense fallback={<div className="carregando">Carregando...</div>}>
      <FormCadastro />
    </Suspense>
  );
}
