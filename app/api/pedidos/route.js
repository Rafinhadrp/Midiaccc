import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { criarPix, gerarCodigo } from "@/lib/pagamentos/mercadopago";

const MINUTOS_PARA_PAGAR = 30;

/** Cria o pedido e a cobrança Pix. Aberto ao público. */
export async function POST(req) {
  let corpo;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido" }, { status: 400 });
  }

  const { eventoId, nome, email, telefone, quantidade = 1 } = corpo;

  if (!eventoId || !nome?.trim() || !email?.trim()) {
    return NextResponse.json({ erro: "Preencha nome e e-mail." }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    return NextResponse.json({ erro: "E-mail inválido." }, { status: 400 });
  }

  const digitos = String(telefone ?? "").replace(/\D/g, "");
  if (digitos.length < 10) {
    return NextResponse.json({ erro: "Informe um WhatsApp válido com DDD." }, { status: 400 });
  }

  const qtd = Number(quantidade);
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > 10) {
    return NextResponse.json({ erro: "Quantidade inválida." }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // Libera as vagas de quem abandonou o pagamento
  await admin.rpc("expirar_pedidos_vencidos");

  const { data: evento } = await admin
    .from("eventos_pagos").select("*").eq("id", eventoId).maybeSingle();

  if (!evento) return NextResponse.json({ erro: "Evento não encontrado." }, { status: 404 });
  if (!evento.vendas_abertas) {
    return NextResponse.json({ erro: "As vendas deste evento estão fechadas." }, { status: 409 });
  }

  // Vaga só é ocupada por pedido pago
  if (evento.limite_vagas) {
    const { data: ocupadas } = await admin.rpc("vagas_ocupadas", { evento: eventoId });
    const restantes = evento.limite_vagas - (ocupadas ?? 0);

    if (restantes <= 0) {
      return NextResponse.json({ erro: "As vagas deste evento se esgotaram." }, { status: 409 });
    }
    if (qtd > restantes) {
      return NextResponse.json(
        { erro: `Restam apenas ${restantes} ${restantes === 1 ? "vaga" : "vagas"}.` },
        { status: 409 }
      );
    }
  }

  const valor = evento.preco_centavos * qtd;

  const { data: pedido, error } = await admin
    .from("pedidos")
    .insert({
      evento_id: eventoId,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      telefone: telefone.trim(),
      quantidade: qtd,
      valor_centavos: valor,
      codigo: gerarCodigo(),
    })
    .select("id, codigo")
    .single();

  if (error) {
    console.error("Falha ao criar pedido:", error);
    return NextResponse.json({ erro: "Não foi possível criar o pedido." }, { status: 500 });
  }

  // Evento gratuito não passa pelo Mercado Pago
  if (valor === 0) {
    await admin
      .from("pedidos")
      .update({ status: "pago", pago_em: new Date().toISOString() })
      .eq("id", pedido.id);

    return NextResponse.json({ pedidoId: pedido.id, codigo: pedido.codigo, gratuito: true });
  }

  const pix = await criarPix({
    centavos: valor,
    descricao: `${evento.nome} — ${qtd} ${qtd === 1 ? "ingresso" : "ingressos"}`,
    comprador: { nome: nome.trim(), email: email.trim().toLowerCase() },
    referencia: pedido.id,
    minutos: MINUTOS_PARA_PAGAR,
  });

  if (!pix.ok) {
    await admin.from("pedidos").update({ status: "cancelado" }).eq("id", pedido.id);
    return NextResponse.json({ erro: pix.erro }, { status: 502 });
  }

  await admin
    .from("pedidos")
    .update({ pagamento_id: pix.pagamentoId, expira_em: pix.expiraEm })
    .eq("id", pedido.id);

  return NextResponse.json({
    pedidoId: pedido.id,
    codigo: pedido.codigo,
    copiaECola: pix.copiaECola,
    qrBase64: pix.qrBase64,
    expiraEm: pix.expiraEm,
    valorCentavos: valor,
  });
}
