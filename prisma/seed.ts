import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  { team: "Flamengo", model: "home", size: "M", quantity: 8, costPrice: 120, sellPrice: 220 },
  { team: "Flamengo", model: "home", size: "G", quantity: 5, costPrice: 120, sellPrice: 220 },
  { team: "Flamengo", model: "away", size: "M", quantity: 3, costPrice: 130, sellPrice: 240 },
  { team: "Flamengo", model: "retro", size: "G", quantity: 2, costPrice: 150, sellPrice: 280 },
  { team: "Corinthians", model: "home", size: "P", quantity: 6, costPrice: 115, sellPrice: 210 },
  { team: "Corinthians", model: "home", size: "M", quantity: 4, costPrice: 115, sellPrice: 210 },
  { team: "Corinthians", model: "away", size: "G", quantity: 1, costPrice: 125, sellPrice: 230 },
  { team: "Palmeiras", model: "home", size: "M", quantity: 7, costPrice: 118, sellPrice: 215 },
  { team: "Palmeiras", model: "third", size: "GG", quantity: 3, costPrice: 135, sellPrice: 250 },
  { team: "São Paulo", model: "home", size: "M", quantity: 5, costPrice: 115, sellPrice: 210 },
  { team: "São Paulo", model: "away", size: "G", quantity: 2, costPrice: 125, sellPrice: 230 },
  { team: "Santos", model: "home", size: "P", quantity: 4, costPrice: 110, sellPrice: 200 },
  { team: "Santos", model: "retro", size: "M", quantity: 2, costPrice: 145, sellPrice: 270 },
  { team: "Vasco", model: "home", size: "G", quantity: 6, costPrice: 112, sellPrice: 205 },
  { team: "Botafogo", model: "home", size: "M", quantity: 1, costPrice: 112, sellPrice: 205 },
];

async function main() {
  console.log("🌱 Inserindo dados de exemplo...");

  for (const p of products) {
    await prisma.product.upsert({
      where: { team_model_size: { team: p.team, model: p.model, size: p.size } },
      update: {},
      create: p,
    });
  }

  // Sample sales for the last 30 days
  const allProducts = await prisma.product.findMany();
  const paymentMethods = ["pix", "card", "cash"];

  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const product = allProducts[Math.floor(Math.random() * allProducts.length)];
    const quantity = Math.floor(Math.random() * 2) + 1;
    const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const total = product.sellPrice * quantity;

    await prisma.sale.create({
      data: {
        date,
        paymentMethod: method,
        total,
        items: {
          create: [
            {
              productId: product.id,
              quantity,
              unitPrice: product.sellPrice,
              costPrice: product.costPrice,
            },
          ],
        },
      },
    });
  }

  console.log("✅ Seed concluído! 15 produtos e 20 vendas criados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
