import { prisma } from "./prisma";

// ---------------------------------------------------------------------------
// CUSTO MÉDIO PONDERADO POR TIPO DE CAMISA
// Calcula o custo médio de cada modelo baseado nos pedidos entregues
// ---------------------------------------------------------------------------

// Mapeamento: tipo do pedido → modelo(s) e fração da quantidade
const ORDER_TYPE_COST_MAP: Record<string, { model: string; frac: number }[]> = {
  "Amarela Torc":    [{ model: "Torcedor Masc Amarela", frac: 1   }],
  "Azul Torc":       [{ model: "Torcedor Masc Azul",    frac: 1   }],
  "Amarela FEM":     [{ model: "Torcedor Fem Amarela",  frac: 1   }],
  "Azul FEM":        [{ model: "Torcedor Fem Azul",     frac: 1   }],
  "Am + Az Torc":    [{ model: "Torcedor Masc Amarela", frac: 0.5 }, { model: "Torcedor Masc Azul", frac: 0.5 }],
  "Am + Az Jogador": [{ model: "Jogador Masc Amarela",  frac: 0.5 }, { model: "Jogador Masc Azul",  frac: 0.5 }],
  "Amarela Jog":     [{ model: "Jogador Masc Amarela",  frac: 1   }],
  "Azul Jog":        [{ model: "Jogador Masc Azul",     frac: 1   }],
};

// Retorna custo médio ponderado por modelo, calculado dos pedidos entregues
export async function computeAverageCosts(): Promise<Record<string, number>> {
  const orders = await prisma.order.findMany({ where: { status: "Entregue" } });

  const acc: Record<string, { totalCost: number; totalQty: number }> = {};

  for (const order of orders) {
    const mappings = ORDER_TYPE_COST_MAP[order.type];
    if (!mappings) continue;

    const unitCost =
      (order.value + (order.taxes ?? 0) + (order.packagingCost ?? 0)) / order.quantity;

    for (const { model, frac } of mappings) {
      const qty = Math.round(order.quantity * frac);
      if (!acc[model]) acc[model] = { totalCost: 0, totalQty: 0 };
      acc[model].totalCost += unitCost * qty;
      acc[model].totalQty  += qty;
    }
  }

  const averages: Record<string, number> = {};
  for (const [model, { totalCost, totalQty }] of Object.entries(acc)) {
    averages[model] = totalQty > 0 ? totalCost / totalQty : 0;
  }
  return averages;
}

// Retorna o custo médio ponderado para um modelo específico
export async function getAverageCostForModel(productModel: string): Promise<number> {
  const averages = await computeAverageCosts();
  return averages[productModel] ?? 0;
}

// ---------------------------------------------------------------------------
// AUTO-FULFILLMENT DE RESERVAS
// Quando chega estoque novo, trava automaticamente para reservas pagas
// ---------------------------------------------------------------------------

export async function autoFulfillReservas(productId: number) {
  // Get all unfulfilled items for paid reservas, oldest first
  const candidates = await prisma.reservaItem.findMany({
    where: {
      productId,
      reserva: { paymentStatus: "pago", status: { in: ["pendente", "parcial"] } },
    },
    include: { reserva: true },
    orderBy: { reserva: { date: "asc" } },
  });

  // Filter to only truly unfulfilled items
  const pendingItems = candidates.filter((i) => i.quantityFulfilled < i.quantityRequested);

  for (const item of pendingItems) {
    const stillNeeded = item.quantityRequested - item.quantityFulfilled;

    const fresh = await prisma.product.findUnique({ where: { id: productId } });
    if (!fresh || fresh.quantity <= 0) break;

    const canFulfill = Math.min(stillNeeded, fresh.quantity);

    await prisma.product.update({
      where: { id: productId },
      data: { quantity: { decrement: canFulfill } },
    });

    const updatedItem = await prisma.reservaItem.update({
      where: { id: item.id },
      data: { quantityFulfilled: { increment: canFulfill } },
    });

    // Recalculate reserva status
    const allItems = await prisma.reservaItem.findMany({ where: { reservaId: item.reservaId } });
    const totalReq = allItems.reduce((s, i) => s + i.quantityRequested, 0);
    const totalFul = allItems.reduce((s, i) => s + (i.id === updatedItem.id ? updatedItem.quantityFulfilled : i.quantityFulfilled), 0);
    const newStatus = totalFul >= totalReq ? "concluida" : totalFul > 0 ? "parcial" : "pendente";

    await prisma.reserva.update({ where: { id: item.reservaId }, data: { status: newStatus } });
  }
}

// ---------------------------------------------------------------------------
// MAPEAMENTO DE ESTOQUE
// ---------------------------------------------------------------------------

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
