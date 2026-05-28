import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: Number(params.id) } });
  if (!product) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { team, model, size, quantity, costPrice, sellPrice } = body;

  const product = await prisma.product.update({
    where: { id: Number(params.id) },
    data: {
      ...(team != null ? { team } : {}),
      ...(model != null ? { model } : {}),
      ...(size != null ? { size } : {}),
      ...(quantity != null ? { quantity: Number(quantity) } : {}),
      ...(costPrice != null ? { costPrice: Number(costPrice) } : {}),
      ...(sellPrice != null ? { sellPrice: Number(sellPrice) } : {}),
    },
  });

  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  // supports { delta: +1 | -1 } for quick increment/decrement
  if (body.delta != null) {
    const product = await prisma.product.update({
      where: { id: Number(params.id) },
      data: { quantity: { increment: Number(body.delta) } },
    });
    return NextResponse.json(product);
  }
  return NextResponse.json({ error: "Use delta" }, { status: 400 });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.product.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
