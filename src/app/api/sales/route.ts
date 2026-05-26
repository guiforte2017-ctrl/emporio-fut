import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAverageCostForModel } from "@/lib/fifo";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const team = searchParams.get("team");
  const paymentStatus = searchParams.get("paymentStatus");

  const sales = await prisma.sale.findMany({
    where: {
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
            },
          }
        : {}),
      ...(team ? { items: { some: { product: { team } } } } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
    },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, paymentMethod, date, customerName, paymentStatus } = body;

  if (!items?.length || !paymentMethod) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  // Validate stock for all items
  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) {
      return NextResponse.json({ error: `Produto ${item.productId} não encontrado` }, { status: 404 });
    }
    if (product.quantity < item.quantity) {
      return NextResponse.json(
        { error: `Estoque insuficiente para ${product.team} ${product.model} ${product.size}` },
        { status: 400 }
      );
    }
  }

  const total = items.reduce(
    (acc: number, i: { quantity: number; unitPrice: number }) => acc + i.quantity * i.unitPrice,
    0
  );

  // Resolve custo médio ponderado por tipo de camisa
  const itemsWithFifoCost = await Promise.all(
    items.map(async (i: { productId: number; quantity: number; unitPrice: number; costPrice: number }) => {
      const product = await prisma.product.findUnique({ where: { id: i.productId } });
      const avgCost = product ? await getAverageCostForModel(product.model) : 0;
      return {
        ...i,
        costPrice: avgCost > 0 ? avgCost : (product?.costPrice ?? i.costPrice),
      };
    })
  );

  const sale = await prisma.$transaction(async (tx) => {
    const newSale = await tx.sale.create({
      data: {
        paymentMethod,
        total,
        date: date ? new Date(date) : new Date(),
        customerName: customerName ?? null,
        paymentStatus: paymentStatus ?? "pago",
        items: {
          create: itemsWithFifoCost.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            costPrice: i.costPrice,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    for (const item of itemsWithFifoCost) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    return newSale;
  });

  return NextResponse.json(sale, { status: 201 });
}
