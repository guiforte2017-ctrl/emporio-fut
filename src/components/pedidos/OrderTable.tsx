"use client";

import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatusBadge, ORDER_STATUSES } from "./OrderStatusBadge";
import { OrderForm } from "./OrderForm";

interface Order {
  id: number;
  type: string;
  quantity: number;
  value: number;
  taxes: number | null;
  packagingCost: number | null;
  orderDate: string;
  trackingCode: string | null;
  sizes: string | null;
  payment: string | null;
  status: string;
  lastUpdate: string | null;
  cpf: string | null;
  orderedBy: string | null;
  estimatedArrival: string | null;
}

export function OrderTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/orders?${params}`);
    setOrders(await res.json());
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleDelete(id: number) {
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchOrders();
  }

  const totalValue     = orders.reduce((s, o) => s + o.value, 0);
  const totalTaxes     = orders.reduce((s, o) => s + (o.taxes ?? 0), 0);
  const totalPackaging = orders.reduce((s, o) => s + (o.packagingCost ?? 0), 0);
  const totalShirts    = orders.reduce((s, o) => s + o.quantity, 0);
  const totalCost      = totalValue + totalTaxes + totalPackaging;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total pedidos",    value: `${orders.length} pedidos (${totalShirts} camisas)` },
          { label: "Custo total real", value: formatCurrency(totalCost), sub: `valor + impostos + embalagem` },
          { label: "Custo médio/un.", value: formatCurrency(totalShirts > 0 ? totalCost / totalShirts : 0) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-surface-600 bg-surface-800 p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className="text-lg font-bold text-gray-100 mt-1">{s.value}</p>
            {"sub" in s && <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Filters + Add */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="sm:ml-auto">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" />Novo Pedido</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Adicionar Pedido</DialogTitle></DialogHeader>
              <OrderForm onSuccess={() => { setAddOpen(false); fetchOrders(); }} onCancel={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-surface-600 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="border-b border-surface-600 bg-surface-800">
                <th className="text-left px-3 py-3 font-medium text-gray-400">#</th>
                <th className="text-left px-3 py-3 font-medium text-gray-400">Tipo</th>
                <th className="text-right px-3 py-3 font-medium text-gray-400">Qtd</th>
                <th className="text-right px-3 py-3 font-medium text-gray-400">Valor</th>
                <th className="text-right px-3 py-3 font-medium text-gray-400">Impostos</th>
                <th className="text-right px-3 py-3 font-medium text-gray-400">Embalagem</th>
                <th className="text-right px-3 py-3 font-medium text-gray-400">Custo/un.</th>
                <th className="text-left px-3 py-3 font-medium text-gray-400">Data</th>
                <th className="text-left px-3 py-3 font-medium text-gray-400">Rastreio</th>
                <th className="text-left px-3 py-3 font-medium text-gray-400">Tamanhos</th>
                <th className="text-left px-3 py-3 font-medium text-gray-400">De Quem</th>
                <th className="text-left px-3 py-3 font-medium text-gray-400">Previsão</th>
                <th className="text-left px-3 py-3 font-medium text-gray-400">Status</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={14} className="text-center py-12 text-gray-500">Carregando...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={14} className="text-center py-12 text-gray-500">Nenhum pedido encontrado</td></tr>
              ) : (
                orders.map((o, idx) => (
                  <tr key={o.id} className="border-b border-surface-700 hover:bg-surface-800/50 transition-colors">
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{orders.length - idx}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-100 whitespace-nowrap">{o.type}</td>
                    <td className="px-3 py-2.5 text-right text-gray-300">{o.quantity}</td>
                    <td className="px-3 py-2.5 text-right text-gray-200">{formatCurrency(o.value)}</td>
                    <td className="px-3 py-2.5 text-right text-yellow-400">{o.taxes ? formatCurrency(o.taxes) : <span className="text-gray-600">—</span>}</td>
                    <td className="px-3 py-2.5 text-right text-orange-400">{o.packagingCost ? formatCurrency(o.packagingCost) : <span className="text-gray-600">—</span>}</td>
                    <td className="px-3 py-2.5 text-right text-brand-400 font-medium text-xs">
                      {formatCurrency((o.value + (o.taxes ?? 0) + (o.packagingCost ?? 0)) / o.quantity)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{formatDate(o.orderDate)}</td>
                    <td className="px-3 py-2.5">
                      {o.trackingCode ? (
                        <a
                          href={`https://rastreamento.correios.com.br/app/index.php?objeto=${o.trackingCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-brand-400 hover:text-brand-300 font-mono text-xs"
                        >
                          {o.trackingCode}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs">{o.sizes ?? "—"}</td>
                    <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{o.orderedBy ?? "—"}</td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{o.estimatedArrival ?? "—"}</td>
                    <td className="px-3 py-2.5"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <Dialog open={editOrder?.id === o.id} onOpenChange={(open) => !open && setEditOrder(null)}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => setEditOrder(o)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Editar Pedido</DialogTitle></DialogHeader>
                            <OrderForm
                              initial={o as unknown as Record<string, unknown>}
                              onSuccess={() => { setEditOrder(null); fetchOrders(); }}
                              onCancel={() => setEditOrder(null)}
                            />
                          </DialogContent>
                        </Dialog>

                        <Dialog open={deleteId === o.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteId(o.id)}>
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Excluir pedido?</DialogTitle></DialogHeader>
                            <p className="text-sm text-gray-400 mb-4">Pedido <strong className="text-gray-100">{o.type} — {o.trackingCode}</strong> será removido.</p>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
                              <Button variant="destructive" onClick={() => handleDelete(o.id)}>Excluir</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {orders.length > 0 && (
              <tfoot>
                <tr className="border-t border-surface-600 bg-surface-800/50">
                  <td colSpan={2} className="px-3 py-2.5 text-xs text-gray-500 font-medium">TOTAL ({orders.length} pedidos)</td>
                  <td className="px-3 py-2.5 text-right text-gray-300 font-semibold">{totalShirts}</td>
                  <td className="px-3 py-2.5 text-right text-gray-100 font-semibold">{formatCurrency(totalValue)}</td>
                  <td className="px-3 py-2.5 text-right text-yellow-400 font-semibold">{formatCurrency(totalTaxes)}</td>
                  <td className="px-3 py-2.5 text-right text-orange-400 font-semibold">{formatCurrency(totalPackaging)}</td>
                  <td className="px-3 py-2.5 text-right text-brand-400 font-semibold text-xs">{formatCurrency(totalShirts > 0 ? totalCost / totalShirts : 0)}</td>
                  <td colSpan={5}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
