import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
    },
    orderBy: { orderDate: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, quantity, value, taxes, orderDate, trackingCode, sizes, payment, status, lastUpdate, cpf, orderedBy, estimatedArrival, notes } = body;

  if (!type || !quantity || !value || !orderDate) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      type,
      quantity: Number(quantity),
      value: Number(value),
      taxes: taxes ? Number(taxes) : null,
      orderDate: new Date(orderDate),
      trackingCode: trackingCode ?? null,
      sizes: sizes ?? null,
      payment: payment ?? null,
      status: status ?? "Informações enviadas",
      lastUpdate: lastUpdate ? new Date(lastUpdate) : null,
      cpf: cpf ?? null,
      orderedBy: orderedBy ?? null,
      estimatedArrival: estimatedArrival ?? null,
      notes: notes ?? null,
    },
  });

  return NextResponse.json(order, { status: 201 });
}
