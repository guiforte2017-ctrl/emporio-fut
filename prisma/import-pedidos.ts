import { PrismaClient } from "@prisma/client";
import { createLotsForOrder } from "../src/lib/fifo";

const prisma = new PrismaClient();

function d(day: string, month: string): Date {
  const months: Record<string, number> = {
    jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
    jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
  };
  return new Date(2026, months[month], Number(day));
}

const ORDERS = [
  { type: "Amarela Torc",    qty: 8, value: 448.96, taxes: 185.52, date: d("25","mar"), tracking: "LZ391258974CN", sizes: "3-S, 3-M, 2-L",         payment: "Forte",      status: "Entregue",              lastUpdate: d("12","mai"), cpf: "086.199.064-10", orderedBy: "João Pedro",  eta: "11-13/mai" },
  { type: "Azul Torc",       qty: 8, value: 442.56, taxes: 188.87, date: d("25","mar"), tracking: "LZ391258722CN", sizes: "3-S, 3-M, 2-L",         payment: "André",      status: "Entregue",              lastUpdate: d("28","abr"), cpf: "700.175.474-90", orderedBy: "André",      eta: "N/D" },
  { type: "Am + Az Jogador", qty: 8, value: 791.86, taxes: 204.27, date: d("31","mar"), tracking: "LZ394106289CN", sizes: "4-S, 2-M, 2-L",         payment: "André",      status: "Entregue",              lastUpdate: d("12","mai"), cpf: "700.838.394-18", orderedBy: "André",      eta: "N/D" },
  { type: "Amarela Torc",    qty: 8, value: 526.06, taxes: 206.15, date: d("31","mar"), tracking: "LZ394106332CN", sizes: "1-S, 2-M, 3-L, 2-XL",  payment: "Forte",      status: "Entregue",              lastUpdate: d("07","mai"), cpf: "086.199.064-10", orderedBy: "João Pedro",  eta: "N/D" },
  { type: "Amarela Torc",    qty: 8, value: 451.06, taxes: 202.00, date: d("02","abr"), tracking: "LZ395113079CN", sizes: "3-S, 3-M, 2-L",         payment: "Forte",      status: "Entregue",              lastUpdate: d("12","mai"), cpf: "086.199.064-10", orderedBy: "João Pedro",  eta: "11-13/mai" },
  { type: "Azul Torc",       qty: 8, value: 448.98, taxes: 203.95, date: d("06","abr"), tracking: "LZ396909266CN", sizes: "1-S, 2-M, 3-L, 2-XL",  payment: "Forte",      status: "Entregue",              lastUpdate: d("12","mai"), cpf: "086.199.064-10", orderedBy: "João Pedro",  eta: null },
  { type: "Azul Torc",       qty: 8, value: 448.98, taxes: null,   date: d("06","abr"), tracking: "LZ396909235CN", sizes: "3-S, 3-M, 2-L",         payment: "Forte",      status: "Recebido BR",           lastUpdate: d("23","abr"), cpf: "700.838.394-18", orderedBy: "Forte",       eta: "N/D" },
  { type: "Am + Az Jogador", qty: 8, value: 660.76, taxes: 197.00, date: d("14","abr"), tracking: "LZ400365585CN", sizes: "4-S, 2-M, 2-L",         payment: "André",      status: "Em transf (CWB-NAT)",   lastUpdate: d("12","mai"), cpf: "086.199.064-10", orderedBy: "João Pedro",  eta: "19-21/mai" },
  { type: "Amarela Torc",    qty: 5, value: 271.51, taxes: null,   date: d("15","abr"), tracking: "LZ401389336CN", sizes: "3-S, 3-M, 2-L, 2-XL",  payment: "Forte",      status: "Recebido BR",           lastUpdate: d("23","abr"), cpf: "700.838.394-18", orderedBy: "Forte",       eta: "N/D" },
  { type: "Amarela Torc",    qty: 5, value: 271.51, taxes: null,   date: d("15","abr"), tracking: "LZ401389340CN", sizes: "3-S, 3-M, 2-L, 2-XL",  payment: "Forte",      status: "Recebido BR",           lastUpdate: d("23","abr"), cpf: "700.838.394-18", orderedBy: "Forte",       eta: "N/D" },
  { type: "Azul Torc",       qty: 8, value: 434.79, taxes: null,   date: d("16","abr"), tracking: "LZ401389367CN", sizes: "2-S, 2-M, 2-L",         payment: "Forte",      status: "Recebido BR",           lastUpdate: d("02","mai"), cpf: "700.838.394-18", orderedBy: "Forte",       eta: "N/D" },
  { type: "Personalizado",   qty: 8, value: 575.72, taxes: 207.23, date: d("20","abr"), tracking: "LZ403693854CN", sizes: "4 Serginho, A&F (J)",    payment: "Forte",      status: "Em transf (CWB-NAT)",   lastUpdate: d("14","mai"), cpf: "107.063.234-16", orderedBy: "Serginho",    eta: "23-24/mai" },
  { type: "Amarela Torc",    qty: 8, value: 432.08, taxes: 200.35, date: d("20","abr"), tracking: "LZ403693871CN", sizes: "2-S, 2-M, 2-L, 2-XL",  payment: "Forte",      status: "Em transf (CWB-NAT)",   lastUpdate: d("14","mai"), cpf: "700.175.474-90", orderedBy: "André",       eta: "23-24/mai" },
  { type: "Azul Torc",       qty: 8, value: 432.28, taxes: 192.90, date: d("21","abr"), tracking: "LZ404125024CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Em transf (CWB-NAT)",   lastUpdate: d("12","mai"), cpf: "086.199.064-10", orderedBy: "Jp",          eta: "19-21/mai" },
  { type: "Am + Az Torc",    qty: 8, value: 432.28, taxes: 203.15, date: d("21","abr"), tracking: "LZ405144753CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Em transf (CWB-NAT)",   lastUpdate: d("13","mai"), cpf: "700.838.394-18", orderedBy: "Forte",       eta: "23-24/mai" },
  { type: "Am + Az Jogador", qty: 8, value: 648.21, taxes: 208.30, date: d("22","abr"), tracking: "LZ405521698CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte mãe",  status: "Importação autorizada", lastUpdate: d("05","mai"), cpf: "007.921.034-16", orderedBy: "Forte mãe",   eta: "28-30/mai" },
  { type: "Am + Az Jogador", qty: 8, value: 655.40, taxes: 208.15, date: d("24","abr"), tracking: "LZ405521772CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Luna",       status: "Recebido BR",           lastUpdate: d("13","mai"), cpf: "109.631.414-22", orderedBy: "Luna",        eta: "28-30/mai" },
  { type: "Amarela FEM",     qty: 8, value: 436.94, taxes: 175.35, date: d("23","abr"), tracking: "LZ405521786CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Recebido BR",           lastUpdate: d("13","mai"), cpf: "099.502.184-89", orderedBy: "Sacola",      eta: "28-30/mai" },
  { type: "Azul FEM",        qty: 8, value: 437.00, taxes: 166.12, date: d("23","abr"), tracking: "LZ406567285CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Importação autorizada", lastUpdate: d("08","mai"), cpf: "123.226.854-29", orderedBy: "Cadete",      eta: "10-15/jun" },
  { type: "Azul Torc",       qty: 8, value: 437.00, taxes: null,   date: d("24","abr"), tracking: "LZ406567308CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Importação autorizada", lastUpdate: d("12","mai"), cpf: "704.838.324-05", orderedBy: "Forte irmã",  eta: "20-25/jun" },
  { type: "Am + Az Torc",    qty: 8, value: 435.00, taxes: 181.73, date: d("25","abr"), tracking: "LZ406567271CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Importação autorizada", lastUpdate: d("07","mai"), cpf: "379.076.114-15", orderedBy: "André Mãe",   eta: "28-30/mai" },
  { type: "Am + Az Torc",    qty: 8, value: 435.00, taxes: null,   date: d("25","abr"), tracking: "LZ406838972CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Importação autorizada", lastUpdate: d("11","mai"), cpf: "007.921.034-16", orderedBy: "Forte mãe",   eta: "20-25/jun" },
  { type: "Am + Az Jogador", qty: 8, value: 650.00, taxes: null,   date: d("25","abr"), tracking: "LZ407427899CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Importação autorizada", lastUpdate: d("11","mai"), cpf: "084.443.534-18", orderedBy: "André irmã",  eta: "20-25/jun" },
  { type: "Am + Az Jogador", qty: 8, value: 650.00, taxes: null,   date: d("26","abr"), tracking: "LZ407427885CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Importação autorizada", lastUpdate: d("11","mai"), cpf: "704.838.324-05", orderedBy: "Forte irmã",  eta: "10-15/jun" },
  { type: "Amarela Torc",    qty: 8, value: 433.00, taxes: 164.52, date: d("27","abr"), tracking: "LZ407427868CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Importação autorizada", lastUpdate: d("11","mai"), cpf: "700.838.394-18", orderedBy: "Forte",       eta: "10-15/jun" },
  { type: "Azul FEM",        qty: 8, value: 433.00, taxes: null,   date: d("29","abr"), tracking: "LZ407427854CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Importação autorizada", lastUpdate: d("11","mai"), cpf: "700.838.394-18", orderedBy: "Forte",       eta: "10-15/jun" },
  { type: "Azul FEM",        qty: 8, value: 433.00, taxes: 164.23, date: d("29","abr"), tracking: "LZ407427871CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Recebido BR",           lastUpdate: d("15","mai"), cpf: "700.175.474-90", orderedBy: "André",       eta: "10-15/jun" },
  { type: "Azul FEM",        qty: 8, value: 433.00, taxes: 164.78, date: d("29","abr"), tracking: "LZ407427942CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Importação autorizada", lastUpdate: d("11","mai"), cpf: "700.175.474-90", orderedBy: "Jp",          eta: "10-15/jun" },
  { type: "Amarela Torc",    qty: 8, value: 433.00, taxes: 184.47, date: d("29","abr"), tracking: "LZ407977817CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Informações enviadas",  lastUpdate: d("09","mai"), cpf: "086.199.064-10", orderedBy: "Jp",          eta: "10-15/jun" },
  { type: "Am + Az Torc",    qty: 8, value: 435.00, taxes: null,   date: d("02","mai"), tracking: "LZ407977825CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Informações enviadas",  lastUpdate: d("08","mai"), cpf: "007.921.034-16", orderedBy: "Forte mãe",   eta: "10-15/jun" },
  { type: "Amarela Torc",    qty: 8, value: 433.00, taxes: null,   date: d("02","mai"), tracking: "LZ408486791CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Informações enviadas",  lastUpdate: d("08","mai"), cpf: "700.175.474-90", orderedBy: "André",       eta: "10-15/jun" },
  { type: "Azul Torc",       qty: 8, value: 435.00, taxes: 181.35, date: d("02","mai"), tracking: "LZ408486828CN", sizes: "2-S, 3-M, 2-L, 1-XL",  payment: "Forte",      status: "Informações enviadas",  lastUpdate: d("09","mai"), cpf: "704.838.324-05", orderedBy: "Forte irmã",  eta: "10-15/jun" },
  { type: "Amarela FEM",     qty: 8, value: 420.32, taxes: null,   date: d("13","mai"), tracking: "LZ412877490CN", sizes: "2-S, 4-M, 2-L",         payment: "Forte",      status: "Informações enviadas",  lastUpdate: null,          cpf: "700.838.394-18", orderedBy: "Forte",       eta: null },
  { type: "Amarela FEM",     qty: 4, value: 183.89, taxes: null,   date: d("13","mai"), tracking: "LZ413877486CN", sizes: "4-S",                    payment: "André",      status: "Informações enviadas",  lastUpdate: null,          cpf: "700.175.474-90", orderedBy: "André",       eta: null },
];

async function main() {
  console.log("🗑️  Removendo pedidos antigos...");
  await prisma.order.deleteMany({});

  console.log("📦 Importando 34 pedidos...");
  for (const o of ORDERS) {
    await prisma.order.create({
      data: {
        type: o.type,
        quantity: o.qty,
        value: o.value,
        taxes: o.taxes,
        orderDate: o.date,
        trackingCode: o.tracking,
        sizes: o.sizes,
        payment: o.payment,
        status: o.status,
        lastUpdate: o.lastUpdate,
        cpf: o.cpf,
        orderedBy: o.orderedBy,
        estimatedArrival: o.eta,
      },
    });
  }

  // Create FIFO lots for all delivered orders
  console.log("📦 Criando lotes FIFO para pedidos Entregues...");
  const delivered = await prisma.order.findMany({ where: { status: "Entregue" } });
  for (const order of delivered) {
    await createLotsForOrder(order.id);
  }

  const totalValue  = ORDERS.reduce((s, o) => s + o.value, 0);
  const totalTaxes  = ORDERS.reduce((s, o) => s + (o.taxes ?? 0), 0);
  const byStatus = ORDERS.reduce((acc, o) => { acc[o.status] = (acc[o.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  console.log(`\n✅ ${ORDERS.length} pedidos importados!`);
  console.log(`   💰 Valor total: R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  console.log(`   🧾 Impostos:    R$ ${totalTaxes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  console.log(`\n   Status:`);
  Object.entries(byStatus).forEach(([s, n]) => console.log(`   • ${s}: ${n}`));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
