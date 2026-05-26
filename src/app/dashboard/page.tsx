"use client";

import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, ShoppingBag, Percent, AlertTriangle, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { formatCurrency, MODEL_LABELS } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  summary: {
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    margin: number;
    salesCount: number;
  };
  chartData: {
    byDay: { date: string; value: number }[];
    byMonth: { date: string; value: number }[];
  };
  topTeams: { team: string; revenue: number; quantity: number }[];
  lowStock: { id: number; team: string; model: string; size: string; quantity: number }[];
  paymentBreakdown: { method: string; total: number; count: number }[];
}

const PAYMENT_LABELS: Record<string, string> = { pix: "Pix", card: "Cartão", cash: "Dinheiro" };

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  iconBg,
  valueColor,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconBg?: string;
  valueColor?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className={`rounded-lg p-2 ${iconBg ?? "bg-slate-100"}`}>
            <Icon className="h-4 w-4 text-slate-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor ?? "text-slate-800"}`}>{value}</div>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const PERIOD_OPTIONS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "all", label: "Todo período" },
];

export default function DashboardPage() {
  const [period, setPeriod] = useState("30");
  const [data, setData] = useState<DashboardData | null>(null);
  const [chartView, setChartView] = useState<"day" | "month">("day");

  useEffect(() => {
    fetch(`/api/dashboard?period=${period}`)
      .then((r) => r.json())
      .then(setData);
  }, [period]);

  const chartData =
    chartView === "day" ? data?.chartData.byDay ?? [] : data?.chartData.byMonth ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Visão geral do desempenho da loja</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Faturamento"
          value={formatCurrency(data?.summary.totalRevenue ?? 0)}
          sub={`${data?.summary.salesCount ?? 0} vendas`}
          icon={DollarSign}
          iconBg="bg-blue-100"
          valueColor="text-slate-800"
        />
        <StatCard
          title="Custo Total"
          value={formatCurrency(data?.summary.totalCost ?? 0)}
          icon={ShoppingBag}
          iconBg="bg-slate-100"
        />
        <StatCard
          title="Lucro Bruto"
          value={formatCurrency(data?.summary.grossProfit ?? 0)}
          icon={TrendingUp}
          iconBg="bg-green-100"
          valueColor="text-brand-600"
        />
        <StatCard
          title="Margem"
          value={`${(data?.summary.margin ?? 0).toFixed(1)}%`}
          icon={Percent}
          iconBg="bg-green-100"
          valueColor="text-brand-600"
        />
      </div>

      {/* Chart + Top Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Vendas por período</CardTitle>
              <div className="flex gap-1">
                <button
                  onClick={() => setChartView("day")}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    chartView === "day"
                      ? "bg-brand-600 text-white"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Dias
                </button>
                <button
                  onClick={() => setChartView("month")}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    chartView === "month"
                      ? "bg-brand-600 text-white"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Meses
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  width={50}
                />
                <Tooltip
                  contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                  labelStyle={{ color: "#475569" }}
                  formatter={(v: number) => [formatCurrency(v), "Faturamento"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fill="url(#grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Teams */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <CardTitle>Times mais vendidos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!data?.topTeams.length ? (
              <p className="text-sm text-slate-400">Nenhuma venda no período</p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.topTeams.map((t, i) => (
                  <div key={t.team} className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-5 ${i === 0 ? "text-amber-500" : "text-slate-400"}`}>
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-700 font-medium truncate">{t.team}</span>
                        <span className="text-xs text-slate-400">{t.quantity} un.</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${(t.revenue / data.topTeams[0].revenue) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-brand-600 font-medium shrink-0">{formatCurrency(t.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Breakdown + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment breakdown */}
        <Card>
          <CardHeader><CardTitle>Formas de pagamento</CardTitle></CardHeader>
          <CardContent>
            {!data?.paymentBreakdown.length ? (
              <p className="text-sm text-slate-400">Nenhuma venda no período</p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.paymentBreakdown.map((p) => (
                  <div key={p.method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={p.method === "pix" ? "success" : p.method === "cash" ? "warning" : "default"}
                      >
                        {PAYMENT_LABELS[p.method] ?? p.method}
                      </Badge>
                      <span className="text-xs text-slate-400">{p.count} vendas</span>
                    </div>
                    <span className="text-sm font-medium text-slate-700">{formatCurrency(p.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low stock */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <CardTitle>Estoque Crítico</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!data?.lowStock.length ? (
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <span className="text-brand-500">✓</span> Todos os itens com estoque OK
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.lowStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {p.team} — {MODEL_LABELS[p.model]} {p.size}
                    </span>
                    <Badge variant={p.quantity === 0 ? "danger" : "warning"}>
                      {p.quantity === 0 ? "Esgotado" : `${p.quantity} un.`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
