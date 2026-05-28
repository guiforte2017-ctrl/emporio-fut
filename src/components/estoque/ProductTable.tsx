"use client";

import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { ProductForm } from "./ProductForm";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@prisma/client";

const SIZES = ["PP", "P", "M", "G", "GG"];

const MODEL_CONFIG: Record<string, {
  label: string;
  emoji: string;
  header: string;
  bg: string;
  chip: string;
  chipActive: string;
}> = {
  "Torcedor Masc Amarela": {
    label: "Torcedor Masculino",
    emoji: "🟡",
    header: "bg-amber-400 text-amber-950",
    bg: "bg-amber-50 border-amber-200",
    chip: "bg-white border-amber-200 text-slate-400",
    chipActive: "bg-white border-amber-300 text-slate-800",
  },
  "Torcedor Masc Azul": {
    label: "Torcedor Masculino",
    emoji: "🔵",
    header: "bg-blue-600 text-white",
    bg: "bg-blue-50 border-blue-200",
    chip: "bg-white border-blue-200 text-slate-400",
    chipActive: "bg-white border-blue-300 text-slate-800",
  },
  "Torcedor Fem Amarela": {
    label: "Torcedor Feminino",
    emoji: "🟡",
    header: "bg-yellow-300 text-yellow-950",
    bg: "bg-yellow-50 border-yellow-200",
    chip: "bg-white border-yellow-200 text-slate-400",
    chipActive: "bg-white border-yellow-300 text-slate-800",
  },
  "Torcedor Fem Azul": {
    label: "Torcedor Feminino",
    emoji: "🔵",
    header: "bg-indigo-500 text-white",
    bg: "bg-indigo-50 border-indigo-200",
    chip: "bg-white border-indigo-200 text-slate-400",
    chipActive: "bg-white border-indigo-300 text-slate-800",
  },
  "Jogador Masc Amarela": {
    label: "Jogador Masculino",
    emoji: "🟡",
    header: "bg-orange-400 text-orange-950",
    bg: "bg-orange-50 border-orange-200",
    chip: "bg-white border-orange-200 text-slate-400",
    chipActive: "bg-white border-orange-300 text-slate-800",
  },
  "Jogador Masc Azul": {
    label: "Jogador Masculino",
    emoji: "🔵",
    header: "bg-sky-600 text-white",
    bg: "bg-sky-50 border-sky-200",
    chip: "bg-white border-sky-200 text-slate-400",
    chipActive: "bg-white border-sky-300 text-slate-800",
  },
  "Personalizado": {
    label: "Personalizado",
    emoji: "⚙️",
    header: "bg-slate-400 text-white",
    bg: "bg-slate-50 border-slate-200",
    chip: "bg-white border-slate-200 text-slate-400",
    chipActive: "bg-white border-slate-300 text-slate-800",
  },
};

const MODEL_ORDER = [
  "Torcedor Masc Amarela",
  "Torcedor Masc Azul",
  "Torcedor Fem Amarela",
  "Torcedor Fem Azul",
  "Jogador Masc Amarela",
  "Jogador Masc Azul",
  "Personalizado",
];

function qtyColor(qty: number) {
  if (qty === 0) return "text-slate-300";
  if (qty <= 2) return "text-red-500 font-bold";
  if (qty <= 5) return "text-amber-500 font-semibold";
  return "text-green-600 font-semibold";
}

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [adjusting, setAdjusting] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/products");
    setProducts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function handleDelete(id: number) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchProducts();
  }

  async function handleDelta(id: number, delta: number, currentQty: number) {
    if (delta < 0 && currentQty <= 0) return;
    setAdjusting(id);
    // optimistic update
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, quantity: p.quantity + delta } : p));
    await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta }),
    });
    setAdjusting(null);
  }

  // Group products by model
  const byModel: Record<string, Record<string, Product>> = {};
  for (const p of products) {
    if (!byModel[p.model]) byModel[p.model] = {};
    byModel[p.model][p.size] = p;
  }

  const totalCritical = products.filter((p) => p.quantity <= 2 && !SIZES.includes("XGG") || (p.quantity <= 2 && p.size !== "XGG")).length;

  if (loading) {
    return <div className="py-16 text-center text-slate-400">Carregando...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{products.length} produtos cadastrados</p>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />Nova Camisa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar Camisa</DialogTitle></DialogHeader>
            <ProductForm onSuccess={() => { setAddOpen(false); fetchProducts(); }} onCancel={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Low stock alert */}
      {products.filter((p) => p.quantity <= 2 && p.size !== "XGG").length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{products.filter((p) => p.quantity <= 2 && p.size !== "XGG").length}</strong> item(s) com estoque crítico (≤ 2 unidades)
          </span>
        </div>
      )}

      {/* Grouped cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {MODEL_ORDER.map((model) => {
          const cfg = MODEL_CONFIG[model];
          const sizes = byModel[model] ?? {};
          const hasAny = Object.values(sizes).some((p) => p.quantity > 0);
          const firstProduct = Object.values(sizes)[0];
          if (!cfg) return null;

          return (
            <div key={model} className={`rounded-xl border overflow-hidden shadow-sm ${cfg.bg}`}>
              {/* Card header */}
              <div className={`px-4 py-3 flex items-center justify-between ${cfg.header}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cfg.emoji}</span>
                  <div>
                    <p className="text-xs font-medium opacity-80">{cfg.label}</p>
                    <p className="text-sm font-bold leading-tight">
                      {model.includes("Amarela") ? "Amarela" : model.includes("Azul") ? "Azul" : model}
                    </p>
                  </div>
                </div>
                {firstProduct && (
                  <div className="text-right">
                    <p className="text-xs opacity-70">venda</p>
                    <p className="text-sm font-bold">{formatCurrency(firstProduct.sellPrice)}</p>
                  </div>
                )}
              </div>

              {/* Sizes grid */}
              <div className="p-3">
                <div className="grid grid-cols-5 gap-1.5">
                  {SIZES.map((size) => {
                    const p = sizes[size];
                    const qty = p?.quantity ?? 0;
                    const busy = adjusting === p?.id;

                    return (
                      <div
                        key={size}
                        className={`rounded-xl border text-center flex flex-col overflow-hidden ${qty > 0 ? cfg.chipActive : cfg.chip}`}
                      >
                        {/* Size label */}
                        <p className="text-[10px] text-slate-400 pt-2 leading-none">{size}</p>

                        {/* Quantity */}
                        <p className={`text-xl font-bold leading-none py-2 ${qtyColor(qty)}`}>
                          {qty}
                        </p>

                        {/* +/- buttons */}
                        <div className="flex border-t border-current/10">
                          <button
                            disabled={!p || qty <= 0 || busy}
                            onClick={() => p && handleDelta(p.id, -1, qty)}
                            className="flex-1 py-2 text-slate-500 hover:bg-red-50 hover:text-red-500 active:bg-red-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-base font-bold leading-none"
                          >
                            −
                          </button>
                          <span className="w-px bg-current opacity-10" />
                          <button
                            disabled={!p || busy}
                            onClick={() => p && handleDelta(p.id, +1, qty)}
                            className="flex-1 py-2 text-slate-500 hover:bg-green-50 hover:text-green-600 active:bg-green-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-base font-bold leading-none"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cost + total + edit/delete */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-current/10 pt-2">
                  <span>
                    Custo: <strong>{firstProduct ? formatCurrency(firstProduct.costPrice) : "—"}</strong>
                    &nbsp;·&nbsp;
                    Total: <strong className={hasAny ? "text-slate-700" : "text-slate-400"}>
                      {Object.values(sizes).reduce((s, p) => s + (p.quantity ?? 0), 0)} un.
                    </strong>
                  </span>
                  <div className="flex gap-1">
                    {firstProduct && (
                      <>
                        <Dialog open={editProduct?.id === firstProduct.id} onOpenChange={(open) => !open && setEditProduct(null)}>
                          <DialogTrigger asChild>
                            <button
                              onClick={() => setEditProduct(firstProduct)}
                              title="Editar preços"
                              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Editar {model}</DialogTitle></DialogHeader>
                            <ProductForm
                              initial={firstProduct}
                              onSuccess={() => { setEditProduct(null); fetchProducts(); }}
                              onCancel={() => setEditProduct(null)}
                            />
                          </DialogContent>
                        </Dialog>

                        <Dialog open={deleteId === firstProduct.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                          <DialogTrigger asChild>
                            <button
                              onClick={() => setDeleteId(firstProduct.id)}
                              title="Excluir produto"
                              className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Excluir {model}?</DialogTitle></DialogHeader>
                            <p className="text-sm text-slate-500 mb-4">Essa ação não pode ser desfeita.</p>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
                              <Button variant="destructive" onClick={() => handleDelete(firstProduct.id)}>Excluir</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
