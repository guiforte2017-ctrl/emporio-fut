import { prisma } from "./prisma";

// Mapping: order type → product model(s) to update in stock
const ORDER_TO_MODELS: Record<string, string[]> = {
  "Amarela Torc":    ["Torcedor Masc Amarela"],
  "Azul Torc":       ["Torcedor Masc Azul"],
  "Amarela FEM":     ["Torcedor Fem Amarela"],
  "Azul FEM":        ["Torcedor Fem Azul"],
  "Am + Az Torc":    ["Torcedor Masc Amarela", "Torcedor Masc Azul"],
  "Am + Az Jogador": ["Jogador Masc Amarela",  "Jogador Masc Azul"],
};

// Chinese sizes (S/M/L/XL) → Brazilian sizes (PP/P/M/G/GG/XGG)
const SIZE_MAP: Record<string, string> = {
  XS: "PP", S: "P", M: "M", L: "G", XL: "GG", "2XL": "XGG", XXL: "XGG",
  PP: "PP", P: "P", G: "G", GG: "GG", XGG: "XGG",
};

function parseSizes(text: string | null): { size: string; qty: number }[] {
  if (!text) return [];
  return text
    .split(",")
    .map((s) => s.trim())
    .flatMap((part) => {
      const m = part.match(/^(\d+)-([A-Za-z0-9]+)$/);
      if (!m) return [];
      const brSize = SIZE_MAP[m[2].toUpperCase()];
      if (!brSize) return [];
      return [{ size: brSize, qty: Number(m[1]) }];
    });
}

// Called when order status → "Entregue": parse sizes and add to product stock
export async function autoStockEntry(orderId: number) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  const models = ORDER_TO_MODELS[order.type];
  if (!models?.length) return; // Personalizado or unknown: skip

  const sizes = parseSizes(order.sizes);
  if (!sizes.length) return;

  const costPerUnit =
    (order.value + (order.taxes ?? 0) + (order.packagingCost ?? 0)) / order.quantity;

  const defaultSellPrice = order.type.toLowerCase().includes("jogador") ? 220 : 160;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    for (const { size, qty } of sizes) {
      // For mixed orders (Am+Az), split quantities between the two models
      const perModel =
        models.length > 1
          ? i === 0
            ? Math.ceil(qty / models.length)
            : Math.floor(qty / models.length)
          : qty;

      if (perModel <= 0) continue;

      await prisma.product.upsert({
        where: { team_model_size: { team: "Copa 2026", model, size } },
        update: { quantity: { increment: perModel } },
        create: {
          team: "Copa 2026",
          model,
          size,
          quantity: perModel,
          costPrice: costPerUnit,
          sellPrice: defaultSellPrice,
        },
      });
    }
  }
}

// Map a product model name → lot type
export function getLotType(productModel: string): string {
  const m = productModel.toLowerCase();
  if (m.includes("jogador") && m.includes("amarela")) return "Jogador Amarela";
  if (m.includes("jogador") && m.includes("azul"))    return "Jogador Azul";
  if (m.includes("amarela"))                           return "Torcedor Amarela";
  if (m.includes("azul"))                              return "Torcedor Azul";
  return "Personalizado";
}

// Map an order type → one or two lot types (Am+Az orders split equally)
export function getOrderLotTypes(
  orderType: string,
  totalQty: number,
  costPerUnit: number
): { lotType: string; qty: number; cpu: number }[] {
  const t = orderType.toLowerCase();

  if (t.includes("am + az") && t.includes("jogador")) {
    const half = Math.floor(totalQty / 2);
    return [
      { lotType: "Jogador Amarela", qty: Math.ceil(totalQty / 2), cpu: costPerUnit },
      { lotType: "Jogador Azul",    qty: half,                     cpu: costPerUnit },
    ];
  }
  if (t.includes("am + az")) {
    const half = Math.floor(totalQty / 2);
    return [
      { lotType: "Torcedor Amarela", qty: Math.ceil(totalQty / 2), cpu: costPerUnit },
      { lotType: "Torcedor Azul",    qty: half,                     cpu: costPerUnit },
    ];
  }
  if (t.includes("jogador") && t.includes("amarela")) return [{ lotType: "Jogador Amarela",  qty: totalQty, cpu: costPerUnit }];
  if (t.includes("jogador") && t.includes("azul"))    return [{ lotType: "Jogador Azul",      qty: totalQty, cpu: costPerUnit }];
  if (t.includes("amarela"))                           return [{ lotType: "Torcedor Amarela",  qty: totalQty, cpu: costPerUnit }];
  if (t.includes("azul"))                              return [{ lotType: "Torcedor Azul",     qty: totalQty, cpu: costPerUnit }];
  return [{ lotType: "Personalizado", qty: totalQty, cpu: costPerUnit }];
}

// Create inventory lots for an order that just became "Entregue"
export async function createLotsForOrder(orderId: number) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  // Delete any existing lots for this order (in case of re-delivery)
  await prisma.inventoryLot.deleteMany({ where: { orderId } });

  const totalCost = order.value + (order.taxes ?? 0) + (order.packagingCost ?? 0);
  const costPerUnit = totalCost / order.quantity;

  const lots = getOrderLotTypes(order.type, order.quantity, costPerUnit);

  for (const lot of lots) {
    await prisma.inventoryLot.create({
      data: {
        lotType: lot.lotType,
        quantity: lot.qty,
        remaining: lot.qty,
        costPerUnit: lot.cpu,
        orderId,
        receivedAt: order.lastUpdate ?? order.orderDate,
      },
    });
  }
}

// FIFO: get the cost for selling `qty` units of a given lot type.
// Returns the weighted average cost and deducts from lots.
export async function consumeFifo(
  lotType: string,
  qty: number
): Promise<number> {
  const lots = await prisma.inventoryLot.findMany({
    where: { lotType, remaining: { gt: 0 } },
    orderBy: { receivedAt: "asc" },
  });

  // If no lots, fall back to 0 (manual cost entry)
  if (!lots.length) return 0;

  let remaining = qty;
  let totalCost = 0;

  for (const lot of lots) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, lot.remaining);
    totalCost += take * lot.costPerUnit;
    remaining -= take;

    await prisma.inventoryLot.update({
      where: { id: lot.id },
      data: { remaining: lot.remaining - take },
    });
  }

  // If not enough lots, use the last known cost for the remainder
  if (remaining > 0) {
    const lastCost = lots[lots.length - 1].costPerUnit;
    totalCost += remaining * lastCost;
  }

  return totalCost / qty;
}

// Restore lots when a sale is cancelled (FIFO reverse — add back to newest lot)
export async function restoreFifo(lotType: string, qty: number, costPerUnit: number) {
  // Find the most recently used lot of this type
  const lot = await prisma.inventoryLot.findFirst({
    where: { lotType },
    orderBy: { receivedAt: "desc" },
  });

  if (lot) {
    await prisma.inventoryLot.update({
      where: { id: lot.id },
      data: { remaining: { increment: qty } },
    });
  } else {
    // Create a new lot to hold restored stock
    await prisma.inventoryLot.create({
      data: { lotType, quantity: qty, remaining: qty, costPerUnit, receivedAt: new Date() },
    });
  }
}
