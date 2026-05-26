import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// prisma is also used directly in this file
import { createLotsForOrder, autoStockEntry, autoFulfillReservas } from "@/lib/fifo";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({ where: { id: Number(params.id) } });
  if (!order) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  // Check current status BEFORE updating — only trigger stock entry on NEW "Entregue" transition
  const existing = await prisma.order.findUnique({ where: { id: Number(params.id) } });
  const wasAlreadyDelivered = existing?.status === "Entregue";

  const order = await prisma.order.update({
    where: { id: Number(params.id) },
    data: {
      ...(body.type != null ? { type: body.type } : {}),
      ...(body.quantity != null ? { quantity: Number(body.quantity) } : {}),
      ...(body.value != null ? { value: Number(body.value) } : {}),
      ...(body.taxes !== undefined ? { taxes: body.taxes ? Number(body.taxes) : null } : {}),
      ...(body.orderDate != null ? { orderDate: new Date(body.orderDate) } : {}),
      ...(body.trackingCode !== undefined ? { trackingCode: body.trackingCode } : {}),
      ...(body.sizes !== undefined ? { sizes: body.sizes } : {}),
      ...(body.payment !== undefined ? { payment: body.payment } : {}),
      ...(body.status != null ? { status: body.status } : {}),
      ...(body.lastUpdate !== undefined ? { lastUpdate: body.lastUpdate ? new Date(body.lastUpdate) : null } : {}),
      ...(body.cpf !== undefined ? { cpf: body.cpf } : {}),
      ...(body.orderedBy !== undefined ? { orderedBy: body.orderedBy } : {}),
      ...(body.estimatedArrival !== undefined ? { estimatedArrival: body.estimatedArrival } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.packagingCost !== undefined ? { packagingCost: body.packagingCost ? Number(body.packagingCost) : null } : {}),
    },
  });

  // Only on the FIRST transition to "Entregue" — prevents duplicate stock entries
  if (body.status === "Entregue" && !wasAlreadyDelivered) {
    await createLotsForOrder(order.id);
    await autoStockEntry(order.id);

    // After stock is added, auto-fulfill pending paid reservas
    const updatedProducts = await prisma.product.findMany({
      where: { team: "Copa 2026" },
      select: { id: true },
    });
    await Promise.all(updatedProducts.map((p) => autoFulfillReservas(p.id)));
  }

  return NextResponse.json(order);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.order.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
