import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, startOfMonth, format } from "date-fns";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "30"; // 7, 30, or "all"

  const now = new Date();
  let fromDate: Date | undefined;

  if (period === "7") fromDate = startOfDay(subDays(now, 6));
  else if (period === "30") fromDate = startOfDay(subDays(now, 29));
  // "all" = no filter

  // Only count confirmed (pago) sales for financial metrics
  const paidFilter = { paymentStatus: "pago" };

  const sales = await prisma.sale.findMany({
    where: fromDate ? { date: { gte: fromDate }, ...paidFilter } : paidFilter,
    include: { items: true },
    orderBy: { date: "asc" },
  });

  const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0);
  const totalCost = sales.reduce(
    (s, sale) => s + sale.items.reduce((is, i) => is + i.costPrice * i.quantity, 0),
    0
  );
  const grossProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Sales by day (paid only)
  const salesByDay: Record<string, number> = {};
  for (const sale of sales) {
    const day = format(new Date(sale.date), "dd/MM");
    salesByDay[day] = (salesByDay[day] ?? 0) + sale.total;
  }

  // Sales by month (paid only, all time)
  const allSales = await prisma.sale.findMany({
    where: paidFilter,
    include: { items: true },
    orderBy: { date: "asc" },
  });
  const salesByMonth: Record<string, number> = {};
  for (const sale of allSales) {
    const month = format(new Date(sale.date), "MM/yyyy");
    salesByMonth[month] = (salesByMonth[month] ?? 0) + sale.total;
  }

  // Top teams (paid only)
  const saleItems = await prisma.saleItem.findMany({
    where: fromDate
      ? { sale: { date: { gte: fromDate }, ...paidFilter } }
      : { sale: paidFilter },
    include: { product: true },
  });

  const teamRevenue: Record<string, number> = {};
  const teamQty: Record<string, number> = {};
  for (const item of saleItems) {
    const t = item.product.team;
    teamRevenue[t] = (teamRevenue[t] ?? 0) + item.unitPrice * item.quantity;
    teamQty[t] = (teamQty[t] ?? 0) + item.quantity;
  }

  const topTeams = Object.entries(teamRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([team, revenue]) => ({ team, revenue, quantity: teamQty[team] }));

  // Low stock alert
  const lowStock = await prisma.product.findMany({
    where: { quantity: { lte: 2 } },
    orderBy: { quantity: "asc" },
  });

  // Payment breakdown (paid only)
  const paymentBreakdown = await prisma.sale.groupBy({
    by: ["paymentMethod"],
    where: fromDate ? { date: { gte: fromDate }, ...paidFilter } : paidFilter,
    _sum: { total: true },
    _count: true,
  });

  return NextResponse.json({
    summary: { totalRevenue, totalCost, grossProfit, margin, salesCount: sales.length },
    chartData: {
      byDay: Object.entries(salesByDay).map(([date, value]) => ({ date, value })),
      byMonth: Object.entries(salesByMonth).map(([date, value]) => ({ date, value })),
    },
    topTeams,
    lowStock,
    paymentBreakdown: paymentBreakdown.map((p) => ({
      method: p.paymentMethod,
      total: p._sum.total ?? 0,
      count: p._count,
    })),
  });
}
