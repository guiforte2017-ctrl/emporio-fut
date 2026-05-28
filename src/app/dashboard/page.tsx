"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, MODEL_LABELS } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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
const PAYMENT_COLORS: Record<string, string> = {
  pix: "bg-emerald-500",
  card: "bg-blue-500",
  cash: "bg-amber-500",
};

const PERIOD_OPTIONS = [
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "all", label: "Tudo" },
];

function fmt(n: number) { return formatCurrency(n); }

export default function DashboardPage() {
  const [period, setPeriod] = useState("30");
  const [data, setData] = useState<DashboardData | null>(null);
  const [chartView, setChartView] = useState<"day" | "month">("day");

  useEffect(() => {
    fetch(`/api/dashboard?period=${period}`)
      .then((r) => r.json())
      .then(setData);
  }, [period]);

  const chartData = chartView === "day" ? data?.chartData.byDay ?? [] : data?.chartData.byMonth ?? [];
  const margin = data?.summary.margin ?? 0;
  const profit = data?.summary.grossProfit ?? 0;
  const isGood = margin >= 30;

  // payment bar widths
  const maxPayment = Math.max(...(data?.paymentBreakdown.map((p) => p.total) ?? [1]));

  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Visão Geral</h1>
          <p className="text-xs text-slate-400 mt-0.5">Apenas vendas com pagamento confirmado</p>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
          {PERIOD_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setPeriod(o.value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                period === o.value
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Faturamento */}
        <div className="rounded-2xl bg-slate-900 text-white p-5">
          <p className="text-xs text-slate-400 font-medium mb-3">Faturamento</p>
          <p className="text-2xl font-bold tabular-nums leading-none">
            {fmt(data?.summary.totalRevenue ?? 0)}
          </p>
          <p className="text-xs text-slate-500 mt-2">{data?.summary.salesCount ?? 0} vendas</p>
        </div>

        {/* Lucro */}
        <div className={`rounded-2xl p-5 ${profit >= 0 ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          <p className="text-xs text-emerald-100 font-medium mb-3">Lucro bruto</p>
          <p className="text-2xl font-bold tabular-nums leading-none">{fmt(profit)}</p>
          <div className="flex items-center gap-1 mt-2">
            {profit >= 0
              ? <TrendingUp className="h-3 w-3 text-emerald-200" />
              : <TrendingDown className="h-3 w-3 text-red-200" />}
            <p className="text-xs text-emerald-100">depois dos custos</p>
          </div>
        </div>

        {/* Margem */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p className="text-xs text-slate-400 font-medium mb-3">Margem</p>
          <p className={`text-2xl font-bold tabular-nums leading-none ${
            margin >= 30 ? "text-emerald-600" : margin >= 15 ? "text-amber-500" : "text-red-500"
          }`}>
            {margin.toFixed(1)}%
          </p>
          <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                margin >= 30 ? "bg-emerald-500" : margin >= 15 ? "bg-amber-400" : "bg-red-400"
              }`}
              style={{ width: `${Math.min(margin, 100)}%` }}
            />
          </div>
        </div>

        {/* Custo */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p className="text-xs text-slate-400 font-medium mb-3">Custo total</p>
          <p className="text-2xl font-bold text-slate-600 tabular-nums leading-none">
            {fmt(data?.summary.totalCost ?? 0)}
          </p>
          <p className="text-xs text-slate-400 mt-2">custo médio ponderado</p>
        </div>
      </div>

      {/* ── Chart ────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold text-slate-800">Faturamento por período</p>
          <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setChartView("day")}
              className={`text-xs px-3 py-1 rounded-md font-medium transition-all ${
                chartView === "day" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Diário
            </button>
            <button
              onClick={() => setChartView("month")}
              className={`text-xs px-3 py-1 rounded-md font-medium transition-all ${
                chartView === "month" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Mensal
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "none",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                padding: "8px 14px",
              }}
              labelStyle={{ color: "#94a3b8", fontSize: 11, marginBottom: 2 }}
              itemStyle={{ color: "#f8fafc", fontSize: 13, fontWeight: 600 }}
              formatter={(v: number) => [fmt(v), ""]}
              separator=""
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#grad)"
              dot={false}
              activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Bottom Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Mais vendidas */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-800 mb-4">Mais vendidas</p>
          {!data?.topTeams.length ? (
            <p className="text-sm text-slate-400">Nenhuma venda no período</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {data.topTeams.map((t, i) => {
                const pct = (t.revenue / data.topTeams[0].revenue) * 100;
                return (
                  <div key={t.team}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[70%]">{t.team}</span>
                      <span className="text-xs text-slate-400 shrink-0">{t.quantity} un · {fmt(t.revenue)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${i === 0 ? "bg-slate-800" : "bg-slate-300"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Formas de pagamento */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-800 mb-4">Pagamentos</p>
          {!data?.paymentBreakdown.length ? (
            <p className="text-sm text-slate-400">Nenhuma venda no período</p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.paymentBreakdown.map((p) => (
                <div key={p.method}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${PAYMENT_COLORS[p.method] ?? "bg-slate-400"}`} />
                      <span className="text-xs font-medium text-slate-700">{PAYMENT_LABELS[p.method] ?? p.method}</span>
                      <span className="text-xs text-slate-400">{p.count}x</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{fmt(p.total)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${PAYMENT_COLORS[p.method] ?? "bg-slate-400"}`}
                      style={{ width: `${(p.total / maxPayment) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estoque crítico */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-800">Estoque crítico</p>
            {(data?.lowStock.length ?? 0) > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {data!.lowStock.length}
              </span>
            )}
          </div>
          {!data?.lowStock.length ? (
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Todos os itens OK
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {data.lowStock.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <span className="text-xs text-slate-600 truncate">
                    {MODEL_LABELS[p.model] ?? p.model} <span className="text-slate-400">{p.size}</span>
                  </span>
                  <span className={`text-xs font-bold tabular-nums ml-2 ${p.quantity === 0 ? "text-red-500" : "text-amber-500"}`}>
                    {p.quantity === 0 ? "zero" : `${p.quantity} un`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
