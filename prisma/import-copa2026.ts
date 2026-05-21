import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Copa 2026 products — team="Copa 2026", model=version+color, size=PP/P/M/G/GG/XGG
const VERSIONS = [
  { model: "Torcedor Fem Amarela", sellPrice: 160, costPrice: 75 },
  { model: "Torcedor Fem Azul",    sellPrice: 160, costPrice: 75 },
  { model: "Torcedor Masc Amarela", sellPrice: 160, costPrice: 75 },
  { model: "Torcedor Masc Azul",   sellPrice: 160, costPrice: 75 },
  { model: "Jogador Masc Amarela", sellPrice: 220, costPrice: 100 },
  { model: "Jogador Masc Azul",    sellPrice: 220, costPrice: 100 },
];

const SIZES = ["PP", "P", "M", "G", "GG", "XGG"];

// Historical sales from spreadsheet
// All linked to "Copa 2026 - Torcedor Masc Amarela - M" as generic reference
// Stock is NOT decremented (historical data)
const SALES = [
  { date: "2026-05-08", customer: "Thiaguinho",                qty: 1, unitPrice: 130, status: "pago",     method: "pix" },
  { date: "2026-05-08", customer: "Thiaguinho",                qty: 1, unitPrice: 140, status: "pendente", method: "pix" },
  { date: "2026-05-11", customer: "Amigos (LF)",               qty: 4, unitPrice: 140, status: "pago",     method: "pix" },
  { date: "2026-05-11", customer: "Mariana (Mãe JP)",          qty: 1, unitPrice: 140, status: "pendente", method: "pix" },
  { date: "2026-05-13", customer: "Trabalho Mariana (Mãe JP)", qty: 5, unitPrice: 140, status: "pago",     method: "pix" },
  { date: "2026-05-13", customer: "Neylson (Luna)",            qty: 2, unitPrice: 140, status: "pago",     method: "pix" },
  { date: "2026-05-14", customer: "Gabriel Cunha Lima",        qty: 6, unitPrice: 140, status: "pago",     method: "pix" },
  { date: "2026-05-14", customer: "Gabriel (amg Neneco)",      qty: 1, unitPrice: 160, status: "pago",     method: "pix" },
  { date: "2026-05-17", customer: "Marcos (amg Marcelo)",      qty: 5, unitPrice: 140, status: "pago",     method: "pix" },
  { date: "2026-05-18", customer: "Léo Couto",                 qty: 2, unitPrice: 140, status: "pendente", method: "pix" },
  { date: "2026-05-18", customer: "Felipe Felinto",            qty: 1, unitPrice: 140, status: "pendente", method: "pix" },
  { date: "2026-05-18", customer: "Maycon Jr",                 qty: 1, unitPrice: 140, status: "pendente", method: "pix" },
  { date: "2026-05-18", customer: "João Sobreira",             qty: 1, unitPrice: 140, status: "pendente", method: "pix" },
  { date: "2026-05-18", customer: "Mario Frota",               qty: 1, unitPrice: 140, status: "pendente", method: "pix" },
];

async function main() {
  // 1. Delete old seed data (Flamengo, Corinthians, etc.) and old seed sales
  console.log("🧹 Limpando dados de exemplo antigos...");
  await prisma.saleItem.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.product.deleteMany({});

  // 2. Create Copa 2026 products
  console.log("👕 Criando produtos Copa 2026...");
  for (const version of VERSIONS) {
    for (const size of SIZES) {
      await prisma.product.upsert({
        where: { team_model_size: { team: "Copa 2026", model: version.model, size } },
        update: {},
        create: {
          team: "Copa 2026",
          model: version.model,
          size,
          quantity: 0,
          costPrice: version.costPrice,
          sellPrice: version.sellPrice,
        },
      });
    }
  }

  // 3. Find reference product to link historical sales
  const refProduct = await prisma.product.findFirst({
    where: { team: "Copa 2026", model: "Torcedor Masc Amarela", size: "M" },
  });

  if (!refProduct) throw new Error("Produto de referência não encontrado");

  // 4. Import historical sales WITHOUT touching stock
  console.log("📦 Importando vendas da planilha...");
  for (const s of SALES) {
    const total = s.qty * s.unitPrice;
    await prisma.sale.create({
      data: {
        date: new Date(s.date + "T12:00:00"),
        paymentMethod: s.method,
        paymentStatus: s.status,
        customerName: s.customer,
        total,
        items: {
          create: [{
            productId: refProduct.id,
            quantity: s.qty,
            unitPrice: s.unitPrice,
            costPrice: refProduct.costPrice,
          }],
        },
      },
    });
  }

  const totalPago = SALES.filter(s => s.status === "pago").reduce((sum, s) => sum + s.qty * s.unitPrice, 0);
  const totalPendente = SALES.filter(s => s.status === "pendente").reduce((sum, s) => sum + s.qty * s.unitPrice, 0);

  console.log(`\n✅ Importação concluída!`);
  console.log(`   👕 ${VERSIONS.length * SIZES.length} produtos criados (${VERSIONS.length} versões × ${SIZES.length} tamanhos)`);
  console.log(`   🧾 ${SALES.length} vendas importadas`);
  console.log(`   ✅ Pagas:    R$ ${totalPago.toLocaleString("pt-BR")}`);
  console.log(`   ⏳ Pendente: R$ ${totalPendente.toLocaleString("pt-BR")}`);
  console.log(`\n   ⚠️  Lembre de ajustar as quantidades no Estoque para refletir o estoque atual.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
