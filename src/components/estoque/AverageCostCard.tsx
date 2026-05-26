"use client";

import { useEffect, useState } from "react";
import { TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const MODEL_ORDER = [
  "Torcedor Masc Amarela",
  "Torcedor Masc Azul",
  "Torcedor Fem Amarela",
  "Torcedor Fem Azul",
  "Jogador Masc Amarela",
  "Jogador Masc Azul",
];

const MODEL_COLORS: Record<string, string> = {
  "Torcedor Masc Amarela": "bg-amber-100 text-amber-800 border-amber-200",
  "Torcedor Masc Azul":    "bg-blue-100 text-blue-800 border-blue-200",
  "Torcedor Fem Amarela":  "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Torcedor Fem Azul":     "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Jogador Masc Amarela":  "bg-orange-100 text-orange-800 border-orange-200",
  "Jogador Masc Azul":     "bg-sky-100 text-sky-800 border-sky-200",
};

const MODEL_LABELS: Record<string, string> = {
  "Torcedor Masc Amarela": "Torcedor Masc 🟡",
  "Torcedor Masc Azul":    "Torcedor Masc 🔵",
  "Torcedor Fem Amarela":  "Torcedor Fem 🟡",
  "Torcedor Fem Azul":     "Torcedor Fem 🔵",
  "Jogador Masc Amarela":  "Jogador 🟡",
  "Jogador Masc Azul":     "Jogador 🔵",
};

export function AverageCostCard() {
  const [costs, setCosts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cost-average")
      .then((r) => r.json())
      .then((data) => { setCosts(data); setLoading(false); });
  }, []);

  if (loading) return null;

  const entries = MODEL_ORDER.filter((m) => costs[m] != null && costs[m] > 0);
  if (!entries.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="h-4 w-4 text-brand-600" />
        <h3 className="text-sm font-medium text-slate-500">Custo médio ponderado por tipo</h3>
        <span className="text-xs text-slate-400 ml-1">(calculado dos pedidos entregues)</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {entries.map((model) => (
          <div
            key={model}
            className={`rounded-lg border px-3 py-2.5 text-center ${MODEL_COLORS[model] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}
          >
            <p className="text-xs font-medium mb-1">{MODEL_LABELS[model] ?? model}</p>
            <p className="text-base font-bold">{formatCurrency(costs[model])}</p>
            <p className="text-xs opacity-70 mt-0.5">por unidade</p>
          </div>
        ))}
      </div>
    </div>
  );
}
