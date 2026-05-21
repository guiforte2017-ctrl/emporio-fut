import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const sale = await prisma.sale.findUnique({
    where: { id: Number(params.id) },
    include: { items: { include: { product: true } } },
  });
  if (!sale) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(sale);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const sale = await prisma.sale.findUnique({
    where: { id: Number(params.id) },
    include: { items: true },
  });
  if (!sale) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    // Restore stock
    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    }
    await tx.sale.delete({ where: { id: Number(params.id) } });
  });

  return NextResponse.json({ ok: true });
}
