"use client";

import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Plus, AlertTriangle, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { ProductForm } from "./ProductForm";
import { formatCurrency, MODEL_LABELS, SIZES } from "@/lib/utils";
import type { Product } from "@prisma/client";

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (teamFilter) params.set("team", teamFilter);
    if (sizeFilter && sizeFilter !== "all") params.set("size", sizeFilter);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }, [teamFilter, sizeFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function handleDelete(id: number) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchProducts();
  }

  const teams = Array.from(new Set(products.map((p) => p.team))).sort();

  return (
    <div className="flex flex-col gap-4">
      {/* Filters + Add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Filtrar por time..."
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="sm:w-52"
        />
        <Select value={sizeFilter} onValueChange={setSizeFilter}>
          <SelectTrigger className="sm:w-36">
            <Filter className="h-3.5 w-3.5 text-slate-400 mr-1" />
            <SelectValue placeholder="Tamanho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tamanhos</SelectItem>
            {SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="sm:ml-auto">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" />Nova Camisa</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Camisa</DialogTitle>
              </DialogHeader>
              <ProductForm onSuccess={() => { setAddOpen(false); fetchProducts(); }} onCancel={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Time</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Modelo</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Tam.</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Qtd</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Custo</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Venda</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Carregando...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Nenhum produto encontrado</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.team}</td>
                    <td className="px-4 py-3 text-slate-600">{MODEL_LABELS[p.model] ?? p.model}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{p.size}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${p.quantity <= 2 ? "text-red-600" : p.quantity <= 5 ? "text-amber-600" : "text-slate-800"}`}>
                        {p.quantity <= 2 && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                        {p.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 hidden sm:table-cell">{formatCurrency(p.costPrice)}</td>
                    <td className="px-4 py-3 text-right text-brand-600 font-medium">{formatCurrency(p.sellPrice)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <Dialog open={editProduct?.id === p.id} onOpenChange={(open) => !open && setEditProduct(null)}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => setEditProduct(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Editar Camisa</DialogTitle></DialogHeader>
                            <ProductForm
                              initial={p}
                              onSuccess={() => { setEditProduct(null); fetchProducts(); }}
                              onCancel={() => setEditProduct(null)}
                            />
                          </DialogContent>
                        </Dialog>

                        <Dialog open={deleteId === p.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)}>
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Confirmar exclusão</DialogTitle></DialogHeader>
                            <p className="text-sm text-slate-500 mb-4">
                              Tem certeza que quer excluir <strong className="text-slate-800">{p.team} {MODEL_LABELS[p.model]} {p.size}</strong>?
                            </p>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
                              <Button variant="destructive" onClick={() => handleDelete(p.id)}>Excluir</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low stock summary */}
      {products.filter((p) => p.quantity <= 2).length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{products.filter((p) => p.quantity <= 2).length}</strong> item(s) com estoque crítico (≤ 2 unidades)
          </span>
        </div>
      )}
    </div>
  );
}
