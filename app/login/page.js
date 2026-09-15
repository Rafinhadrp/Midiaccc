import { Suspense } from "react";
import FormLogin from "@/components/FormLogin";

export default function Login() {
  return (
    <Suspense fallback={<div className="carregando">Carregando...</div>}>
      <FormLogin />
    </Suspense>
  );
}
