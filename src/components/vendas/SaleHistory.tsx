"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, ChevronDown, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { formatCurrency, formatDate, MODEL_LABELS, PAYMENT_LABELS } from "@/lib/utils";

interface SaleItemData {
  id: number;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  product: { team: string; model: string; size: string };
}

interface Sale {
  id: number;
  date: string;
  paymentMethod: string;
  paymentStatus: string;
  customerName: string | null;
  total: number;
  items: SaleItemData[];
}

const PAYMENT_BADGE: Record<string, "default" | "success" | "warning"> = {
  pix: "success",
  card: "default",
  cash: "warning",
};

export function SaleHistory({ refresh }: { refresh: number }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [teams, setTeams] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (teamFilter && teamFilter !== "all") params.set("team", teamFilter);
    if (statusFilter && statusFilter !== "all") params.set("paymentStatus", statusFilter);
    const res = await fetch(`/api/sales?${params}`);
    const data = await res.json();
    setSales(data);
    const allTeams = [...new Set(data.flatMap((s: Sale) => s.items.map((i) => i.product.team)))] as string[];
    setTeams(allTeams.sort());
    setLoading(false);
  }, [from, to, teamFilter, statusFilter, refresh]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  async function handleDelete(id: number) {
    await fetch(`/api/sales/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchSales();
  }

  const pendingTotal = sales
    .filter((s) => s.paymentStatus === "pendente")
    .reduce((sum, s) => sum + s.total, 0);

  const hasFilters = from || to || (teamFilter !== "all") || (statusFilter !== "all");

  return (
    <div className="flex flex-col gap-4">
      {/* Pending summary banner */}
      {pendingTotal > 0 && statusFilter !== "pago" && (
        <div className="flex items-center justify-between rounded-lg border border-yellow-700 bg-yellow-950/40 px-4 py-3 text-sm">
          <span className="text-yellow-300 font-medium">
            {sales.filter((s) => s.paymentStatus === "pendente").length} venda(s) pendente(s)
          </span>
          <span className="text-yellow-400 font-bold">{formatCurrency(pendingTotal)} a receber</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-38" />
          <span className="text-gray-500 text-sm">até</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-38" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos os times" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os produtos</SelectItem>
            {teams.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setFrom(""); setTo(""); setTeamFilter("all"); setStatusFilter("all"); }}>
            Limpar filtros
          </Button>
        )}
      </div>

      {/* List */}
      <div className="rounded-xl border border-surface-600 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-500 text-sm">Carregando...</div>
        ) : sales.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">Nenhuma venda encontrada</div>
        ) : (
          sales.map((sale) => (
            <div key={sale.id} className="border-b border-surface-700 last:border-0">
              <div
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-800/60 cursor-pointer"
                onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
              >
                <span className="text-gray-500 shrink-0">
                  {expanded === sale.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>
                <span className="text-sm text-gray-400 w-20 shrink-0">{formatDate(sale.date)}</span>

                <div className="flex-1 min-w-0">
                  {sale.customerName && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                      <User className="h-3 w-3" />
                      <span className="truncate">{sale.customerName}</span>
                    </div>
                  )}
                  <span className="text-sm text-gray-200 truncate block">
                    {sale.items.map((i) => `${i.product.team} ${i.product.size}`).join(", ")}
                  </span>
                </div>

                {/* Payment status badge */}
                <Badge
                  variant={sale.paymentStatus === "pago" ? "success" : "warning"}
                  className="shrink-0 hidden sm:flex"
                >
                  {sale.paymentStatus === "pago" ? "Pago" : "Pendente"}
                </Badge>

                <Badge variant={PAYMENT_BADGE[sale.paymentMethod] ?? "default"} className="shrink-0 hidden md:flex">
                  {PAYMENT_LABELS[sale.paymentMethod]}
                </Badge>

                <span className="text-brand-400 font-semibold text-sm shrink-0">{formatCurrency(sale.total)}</span>

                <Dialog open={deleteId === sale.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0"
                      onClick={(e) => { e.stopPropagation(); setDeleteId(sale.id); }}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Cancelar venda?</DialogTitle></DialogHeader>
                    <p className="text-sm text-gray-400 mb-4">
                      Isso vai restaurar o estoque dos itens vendidos. Essa ação não pode ser desfeita.
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setDeleteId(null)}>Não</Button>
                      <Button variant="destructive" onClick={() => handleDelete(sale.id)}>Sim, cancelar venda</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {expanded === sale.id && (
                <div className="bg-surface-900/40 px-4 pb-3 pt-1">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="text-left pb-1">Camisa</th>
                        <th className="text-right pb-1">Qtd</th>
                        <th className="text-right pb-1">Unit.</th>
                        <th className="text-right pb-1">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale.items.map((item) => (
                        <tr key={item.id} className="text-gray-300">
                          <td className="py-0.5">{item.product.team} — {MODEL_LABELS[item.product.model] ?? item.product.model} {item.product.size}</td>
                          <td className="text-right py-0.5">{item.quantity}</td>
                          <td className="text-right py-0.5">{formatCurrency(item.unitPrice)}</td>
                          <td className="text-right py-0.5">{formatCurrency(item.unitPrice * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
