import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoFulfillReservas, getAverageCostForModel } from "@/lib/fifo";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const reserva = await prisma.reserva.findUnique({
    where: { id: Number(params.id) },
    include: { items: { include: { product: true } } },
  });
  if (!reserva) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(reserva);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const id = Number(params.id);

  // ── Faturar: convert fulfilled reserva into a Sale ──────────────────────
  if (body.faturar) {
    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    if (!reserva) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const fulfilledItems = reserva.items.filter((i) => i.quantityFulfilled > 0);
    if (fulfilledItems.length === 0) {
      return NextResponse.json({ error: "Nenhum item atendido para faturar" }, { status: 400 });
    }

    const total = fulfilledItems.reduce((s, i) => s + i.quantityFulfilled * i.unitPrice, 0);

    // Fetch average cost per item model
    const saleItemsData = await Promise.all(
      fulfilledItems.map(async (i) => {
        const avgCost = await getAverageCostForModel(i.product.model);
        return {
          productId: i.productId,
          quantity: i.quantityFulfilled,
          unitPrice: i.unitPrice,
          costPrice: avgCost > 0 ? avgCost : i.product.costPrice,
        };
      })
    );

    await prisma.sale.create({
      data: {
        customerName: reserva.customerName,
        paymentStatus: reserva.paymentStatus,
        paymentMethod: reserva.paymentMethod ?? "pix",
        total,
        isReserva: true, // stock already deducted — skip re-deduction
        date: reserva.date,
        items: { create: saleItemsData },
      },
    });

    // Mark reserva as faturada
    await prisma.reserva.update({ where: { id }, data: { status: "faturada" } });
    return NextResponse.json({ ok: true });
  }

  // ── Normal PATCH ─────────────────────────────────────────────────────────
  const existing = await prisma.reserva.findUnique({ where: { id } });
  const wasNotPaid = existing?.paymentStatus !== "pago";

  const reserva = await prisma.reserva.update({
    where: { id },
    data: {
      ...(body.customerName != null ? { customerName: body.customerName } : {}),
      ...(body.customerContact !== undefined ? { customerContact: body.customerContact } : {}),
      ...(body.paymentStatus != null ? { paymentStatus: body.paymentStatus } : {}),
      ...(body.paymentMethod !== undefined ? { paymentMethod: body.paymentMethod } : {}),
      ...(body.status != null ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    },
    include: { items: { include: { product: true } } },
  });

  // If payment just confirmed → auto-fulfill from stock
  if (body.paymentStatus === "pago" && wasNotPaid) {
    const productIds = Array.from(new Set(reserva.items.map((i) => i.productId)));
    await Promise.all(productIds.map((id) => autoFulfillReservas(id)));
  }

  return NextResponse.json(reserva);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const reserva = await prisma.reserva.findUnique({
    where: { id: Number(params.id) },
    include: { items: true },
  });
  if (!reserva) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // Restore locked stock if reserva was paid and had fulfilled items
  if (reserva.paymentStatus === "pago") {
    for (const item of reserva.items) {
      if (item.quantityFulfilled > 0) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantityFulfilled } },
        });
      }
    }
  }

  await prisma.reserva.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
