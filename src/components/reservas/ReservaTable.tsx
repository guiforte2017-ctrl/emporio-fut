"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Phone, CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { ReservaForm } from "./ReservaForm";
import { formatCurrency, formatDate, MODEL_LABELS } from "@/lib/utils";

interface ReservaItemData {
  id: number;
  quantityRequested: number;
  quantityFulfilled: number;
  unitPrice: number;
  product: { team: string; model: string; size: string };
}

interface Reserva {
  id: number;
  customerName: string;
  customerContact: string | null;
  paymentStatus: string;
  paymentMethod: string | null;
  status: string;
  total: number;
  notes: string | null;
  date: string;
  items: ReservaItemData[];
}

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  pendente:  { label: "Pendente",  class: "bg-slate-100 text-slate-600 border border-slate-200" },
  parcial:   { label: "Parcial",   class: "bg-amber-100 text-amber-700 border border-amber-200" },
  concluida: { label: "Concluída", class: "bg-green-100 text-green-700 border border-green-200" },
  cancelada: { label: "Cancelada", class: "bg-red-100 text-red-600 border border-red-200" },
};

function ProgressBar({ fulfilled, requested }: { fulfilled: number; requested: number }) {
  const pct = requested > 0 ? Math.round((fulfilled / requested) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : pct > 0 ? "bg-amber-400" : "bg-slate-200"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 shrink-0">{fulfilled}/{requested}</span>
    </div>
  );
}

export function ReservaTable() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchReservas = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/reservas?${params}`);
    setReservas(await res.json());
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchReservas(); }, [fetchReservas]);

  async function handleConfirmPayment(id: number) {
    await fetch(`/api/reservas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "pago" }),
    });
    fetchReservas();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/reservas/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchReservas();
  }

  const pending = reservas.filter((r) => r.status !== "concluida" && r.status !== "cancelada");
  const totalPending = pending.reduce((s, r) => s + r.total, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      {pending.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
            <p className="text-xs text-slate-500">Reservas abertas</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{pending.length}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 shadow-sm p-4">
            <p className="text-xs text-amber-600">Parcialmente atendidas</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{reservas.filter((r) => r.status === "parcial").length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
            <p className="text-xs text-slate-500">Valor total em reserva</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalPending)}</p>
          </div>
        </div>
      )}

      {/* Filters + Add */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <div className="sm:ml-auto">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" />Nova Reserva</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Criar Reserva</DialogTitle></DialogHeader>
              <ReservaForm onSuccess={() => { setAddOpen(false); fetchReservas(); }} onCancel={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Carregando...</div>
        ) : reservas.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">Nenhuma reserva encontrada</div>
        ) : (
          reservas.map((r) => {
            const totalReq = r.items.reduce((s, i) => s + i.quantityRequested, 0);
            const totalFul = r.items.reduce((s, i) => s + i.quantityFulfilled, 0);
            const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.pendente;

            return (
              <div key={r.id} className="border-b border-slate-100 last:border-0">
                <div
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                >
                  <span className="text-slate-400 shrink-0">
                    {expanded === r.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800 text-sm">{r.customerName}</span>
                      {r.customerContact && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Phone className="h-3 w-3" />{r.customerContact}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 max-w-xs">
                      <ProgressBar fulfilled={totalFul} requested={totalReq} />
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.class}`}>
                      {badge.label}
                    </span>
                    <Badge variant={r.paymentStatus === "pago" ? "success" : "warning"}>
                      {r.paymentStatus === "pago" ? "Pago" : "Pendente"}
                    </Badge>
                  </div>

                  <span className="text-sm font-semibold text-slate-800 shrink-0">{formatCurrency(r.total)}</span>
                  <span className="text-xs text-slate-400 shrink-0 hidden md:block">{formatDate(r.date)}</span>

                  {/* Confirm payment */}
                  {r.paymentStatus === "pendente" && (
                    <button
                      title="Confirmar pagamento (trava estoque)"
                      onClick={(e) => { e.stopPropagation(); handleConfirmPayment(r.id); }}
                      className="shrink-0 rounded-lg p-1.5 text-amber-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}

                  {/* Delete */}
                  <Dialog open={deleteId === r.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <DialogTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }}
                        className="shrink-0 rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Cancelar reserva de {r.customerName}?</DialogTitle></DialogHeader>
                      <p className="text-sm text-slate-500 mb-4">
                        {r.paymentStatus === "pago" && r.items.some((i) => i.quantityFulfilled > 0)
                          ? "O estoque travado será restaurado automaticamente."
                          : "Essa ação não pode ser desfeita."}
                      </p>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Voltar</Button>
                        <Button variant="destructive" onClick={() => handleDelete(r.id)}>Cancelar reserva</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Expanded detail */}
                {expanded === r.id && (
                  <div className="bg-slate-50 border-t border-slate-100 px-4 pb-4 pt-3">
                    {r.notes && (
                      <p className="text-xs text-slate-500 mb-3 italic">📝 {r.notes}</p>
                    )}
                    <div className="flex flex-col gap-2">
                      {r.items.map((item) => {
                        const pct = item.quantityRequested > 0
                          ? Math.round((item.quantityFulfilled / item.quantityRequested) * 100)
                          : 0;
                        return (
                          <div key={item.id} className="flex items-center gap-3 rounded-lg bg-white border border-slate-200 px-3 py-2">
                            <Package className={`h-4 w-4 shrink-0 ${pct === 100 ? "text-green-500" : pct > 0 ? "text-amber-500" : "text-slate-300"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-700">
                                {MODEL_LABELS[item.product.model] ?? item.product.model} {item.product.size}
                              </p>
                              <ProgressBar fulfilled={item.quantityFulfilled} requested={item.quantityRequested} />
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-slate-400">unit.</p>
                              <p className="text-sm font-medium text-slate-700">{formatCurrency(item.unitPrice)}</p>
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                              pct === 100 ? "bg-green-100 text-green-700" :
                              pct > 0 ? "bg-amber-100 text-amber-700" :
                              "bg-slate-100 text-slate-500"
                            }`}>
                              {pct === 100 ? "✓ Pronto" : pct > 0 ? "Parcial" : "Aguardando"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
