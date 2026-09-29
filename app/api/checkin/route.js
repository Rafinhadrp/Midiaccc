import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { perfilAtual, pode } from "@/lib/permissoes";

/**
 * Registra a entrada de um ingresso.
 *
 * Devolve sempre um `resultado` para a tela pintar de verde, amarelo
 * ou vermelho. O update filtra por checkin_em nulo, então dois
 * voluntários lendo o mesmo código ao mesmo tempo não conseguem
 * registrar duas vezes: o segundo recebe "repetido".
 */
export async function POST(req) {
  const perfil = await perfilAtual();
  if (!perfil) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  if (!pode(perfil, "eventos:gerenciar")) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  let corpo;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido" }, { status: 400 });
  }

  const codigo = String(corpo?.codigo ?? "").trim().toUpperCase();
  if (!codigo) return NextResponse.json({ erro: "Código vazio" }, { status: 400 });

  const admin = supabaseAdmin();

  const { data: pedido } = await admin
    .from("pedidos")
    .select("*, eventos_pagos(nome, data_evento)")
    .eq("codigo", codigo)
    .maybeSingle();

  if (!pedido) {
    return NextResponse.json({ resultado: "nao_existe", codigo });
  }

  const resumo = {
    codigo: pedido.codigo,
    nome: pedido.nome,
    quantidade: pedido.quantidade,
    evento: pedido.eventos_pagos?.nome ?? null,
    status: pedido.status,
  };

  if (pedido.status !== "pago") {
    return NextResponse.json({ resultado: "nao_pago", pedido: resumo });
  }

  if (pedido.checkin_em) {
    return NextResponse.json({
      resultado: "repetido",
      pedido: { ...resumo, checkin_em: pedido.checkin_em },
    });
  }

  const agora = new Date().toISOString();

  const { data: atualizado, error } = await admin
    .from("pedidos")
    .update({ checkin_em: agora, checkin_por: perfil.id })
    .eq("id", pedido.id)
    .is("checkin_em", null)
    .select("id");

  if (error) {
    return NextResponse.json({ erro: "Não deu para registrar: " + error.message }, { status: 500 });
  }

  // Alguém registrou primeiro, entre a leitura e a gravação
  if (!atualizado?.length) {
    return NextResponse.json({
      resultado: "repetido",
      pedido: { ...resumo, checkin_em: agora },
    });
  }

  return NextResponse.json({
    resultado: "liberado",
    pedido: { ...resumo, checkin_em: agora },
  });
}
