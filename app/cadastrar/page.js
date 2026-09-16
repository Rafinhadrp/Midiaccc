import { redirect } from "next/navigation";

/**
 * "Cadastrar" e "inscrever-se" são a mesma coisa aqui: a conta nasce
 * da inscrição e só ganha acesso ao painel depois da aprovação.
 * Esta rota existe para quem digitar /cadastrar na barra.
 */
export default function Cadastrar() {
  redirect("/inscrever");
}
