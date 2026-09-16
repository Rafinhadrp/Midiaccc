import { Suspense } from "react";
import ConfirmarRecuperacao from "@/components/ConfirmarRecuperacao";

export const dynamic = "force-dynamic";

/**
 * Página de chegada dos links de redefinição de senha.
 *
 * Por que uma página com botão, e não um redirecionamento direto:
 * Outlook, Gmail e antivírus corporativos abrem os links dos e-mails
 * sozinhos para checar se são seguros. Como o link do Supabase é de
 * uso único, o robô gastava o link antes da pessoa clicar, e ela
 * recebia "link expirado". Esses robôs só fazem GET e não apertam
 * botão, então a validação acontece no clique.
 */
export default function Recuperar() {
  return (
    <Suspense fallback={<div className="carregando">Carregando...</div>}>
      <ConfirmarRecuperacao />
    </Suspense>
  );
}
