import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoFulfillReservas } from "@/lib/fifo";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const reservas = await prisma.reserva.findMany({
    where: status && status !== "all" ? { status } : {},
    include: { items: { include: { product: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(reservas);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customerName, customerContact, paymentStatus, paymentMethod, items, notes, date } = body;

  if (!customerName || !items?.length) {
    return NextResponse.json({ error: "Nome do cliente e itens são obrigatórios" }, { status: 400 });
  }

  const total = items.reduce(
    (s: number, i: { quantity: number; unitPrice: number }) => s + i.quantity * i.unitPrice,
    0
  );

  // Create the reserva
  const reserva = await prisma.reserva.create({
    data: {
      customerName,
      customerContact: customerContact || null,
      paymentStatus: paymentStatus ?? "pendente",
      paymentMethod: paymentMethod || null,
      total,
      notes: notes || null,
      status: "pendente",
      date: date ? new Date(date) : new Date(),
      items: {
        create: items.map((i: { productId: number; quantity: number; unitPrice: number }) => ({
          productId: i.productId,
          quantityRequested: i.quantity,
          quantityFulfilled: 0,
          unitPrice: i.unitPrice,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });

  // If paid: immediately auto-fulfill from available stock
  if (paymentStatus === "pago") {
    const productIds = Array.from(new Set(reserva.items.map((i) => i.productId)));
    await Promise.all(productIds.map((id) => autoFulfillReservas(id)));
  }

  const updated = await prisma.reserva.findUnique({
    where: { id: reserva.id },
    include: { items: { include: { product: true } } },
  });
  return NextResponse.json(updated, { status: 201 });
}
