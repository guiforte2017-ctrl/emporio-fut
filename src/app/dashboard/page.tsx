"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, MODEL_LABELS } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
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

const PERIOD_OPTIONS = [
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "all", label: "Tudo" },
];

function fmt(n: number) {
  return formatCurrency(n);
}

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

  const margin = data?.summary.margin ?? 0;
  const profit = data?.summary.grossProfit ?? 0;

  return (
    <div className="flex flex-col gap-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Emporio Fut</p>
          <h1 className="text-3xl font-bold text-slate-900 leading-none">Resumo</h1>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {PERIOD_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setPeriod(o.value)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                period === o.value
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Big numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 border-b border-slate-100 pb-8">
        <div>
          <p className="text-xs text-slate-400 mb-1">Faturamento</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{fmt(data?.summary.totalRevenue ?? 0)}</p>
          <p className="text-xs text-slate-400 mt-1">{data?.summary.salesCount ?? 0} vendas</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Lucro bruto</p>
          <p className={`text-2xl font-bold tabular-nums ${profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {fmt(profit)}
          </p>
          <p className="text-xs text-slate-400 mt-1">depois dos custos</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Margem</p>
          <div className="flex items-baseline gap-1">
            <p className={`text-2xl font-bold tabular-nums ${margin >= 30 ? "text-emerald-600" : margin >= 15 ? "text-amber-500" : "text-red-500"}`}>
              {margin.toFixed(1)}%
            </p>
            {margin >= 30 && <ArrowUpRight className="h-4 w-4 text-emerald-500" />}
          </div>
          <p className="text-xs text-slate-400 mt-1">sobre vendas</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Custo total</p>
          <p className="text-2xl font-bold text-slate-500 tabular-nums">{fmt(data?.summary.totalCost ?? 0)}</p>
          <p className="text-xs text-slate-400 mt-1">custo médio ponderado</p>
        </div>
      </div>

      {/* Chart */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-slate-700">Faturamento</p>
          <div className="flex gap-3">
            <button
              onClick={() => setChartView("day")}
              className={`text-xs transition-colors ${chartView === "day" ? "text-slate-800 font-semibold" : "text-slate-400 hover:text-slate-600"}`}
            >
              por dia
            </button>
            <span className="text-slate-200">|</span>
            <button
              onClick={() => setChartView("month")}
              className={`text-xs transition-colors ${chartView === "month" ? "text-slate-800 font-semibold" : "text-slate-400 hover:text-slate-600"}`}
            >
              por mês
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "none",
                borderRadius: 8,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                padding: "8px 12px",
              }}
              labelStyle={{ color: "#64748b", fontSize: 11 }}
              formatter={(v: number) => [fmt(v), ""]}
              separator=""
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#grad)"
              dot={false}
              activeDot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Top models */}
        <div className="lg:col-span-1">
          <p className="text-sm font-semibold text-slate-700 mb-4">Mais vendidas</p>
          {!data?.topTeams.length ? (
            <p className="text-sm text-slate-400">Nenhuma venda no período</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.topTeams.map((t, i) => {
                const pct = (t.revenue / data.topTeams[0].revenue) * 100;
                return (
                  <div key={t.team}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600 font-medium">{t.team}</span>
                      <span className="text-xs text-slate-400">{t.quantity} un.</span>
                    </div>
                    <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${i === 0 ? "bg-emerald-500" : "bg-slate-300"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="lg:col-span-1">
          <p className="text-sm font-semibold text-slate-700 mb-4">Pagamentos</p>
          {!data?.paymentBreakdown.length ? (
            <p className="text-sm text-slate-400">Nenhuma venda no período</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.paymentBreakdown.map((p) => (
                <div key={p.method} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">{PAYMENT_LABELS[p.method] ?? p.method}</span>
                    <span className="text-xs text-slate-400">{p.count}x</span>
                  </div>
                  <span className="text-sm font-medium text-slate-700">{fmt(p.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-sm font-semibold text-slate-700">Estoque crítico</p>
            {(data?.lowStock.length ?? 0) > 0 && (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            )}
          </div>
          {!data?.lowStock.length ? (
            <p className="text-xs text-slate-400">Tudo OK</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.lowStock.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 truncate">
                    {MODEL_LABELS[p.model] ?? p.model} {p.size}
                  </span>
                  <Badge variant={p.quantity === 0 ? "danger" : "warning"}>
                    {p.quantity === 0 ? "0" : p.quantity}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
