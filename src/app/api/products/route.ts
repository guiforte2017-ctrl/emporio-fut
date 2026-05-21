import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const team = searchParams.get("team");
  const size = searchParams.get("size");

  const products = await prisma.product.findMany({
    where: {
      ...(team ? { team } : {}),
      ...(size ? { size } : {}),
    },
    orderBy: [{ team: "asc" }, { model: "asc" }, { size: "asc" }],
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { team, model, size, quantity, costPrice, sellPrice } = body;

  if (!team || !model || !size || quantity == null || !costPrice || !sellPrice) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({
    where: { team_model_size: { team, model, size } },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Já existe um produto com esse time, modelo e tamanho" },
      { status: 409 }
    );
  }

  const product = await prisma.product.create({
    data: { team, model, size, quantity: Number(quantity), costPrice: Number(costPrice), sellPrice: Number(sellPrice) },
  });

  return NextResponse.json(product, { status: 201 });
}
