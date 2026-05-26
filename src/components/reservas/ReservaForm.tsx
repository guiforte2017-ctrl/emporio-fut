"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { formatCurrency, MODEL_LABELS, PAYMENT_LABELS, PAYMENT_METHODS } from "@/lib/utils";
import type { Product } from "@prisma/client";

interface ReservaItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  product?: Product;
}

export function ReservaForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<ReservaItem[]>([{ productId: 0, quantity: 1, unitPrice: 0 }]);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pendente");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  function updateItem(idx: number, key: keyof ReservaItem, value: number | string) {
    setItems((prev) => {
      const next = [...prev];
      if (key === "productId") {
        const prod = products.find((p) => p.id === Number(value));
        next[idx] = { ...next[idx], productId: Number(value), unitPrice: prod?.sellPrice ?? 0, product: prod };
      } else {
        next[idx] = { ...next[idx], [key]: Number(value) };
      }
      return next;
    });
  }

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!customerName.trim()) { setError("Nome do cliente é obrigatório"); return; }
    if (items.some((i) => !i.productId)) { setError("Selecione o produto em todos os itens"); return; }

    setLoading(true);
    const res = await fetch("/api/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName, customerContact: customerContact || null, paymentStatus, paymentMethod, items, notes: notes || null, date }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao criar reserva");
      setLoading(false);
      return;
    }
    setLoading(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Customer */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label>Cliente *</Label>
          <Input placeholder="Nome do cliente..." value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label>Contato (WhatsApp / telefone)</Label>
          <Input placeholder="(xx) xxxxx-xxxx" value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} />
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-2">
        <Label>Camisas reservadas</Label>
        <p className="text-xs text-slate-400">Inclua todas as camisas, mesmo as que ainda não chegaram</p>
        {items.map((item, idx) => (
          <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={item.productId ? String(item.productId) : ""} onValueChange={(v) => updateItem(idx, "productId", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar camisa..." /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {MODEL_LABELS[p.model]} {p.size}
                        <span className={`ml-2 text-xs ${p.quantity > 0 ? "text-green-600" : "text-slate-400"}`}>
                          ({p.quantity > 0 ? `${p.quantity} em estoque` : "sem estoque"})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {items.length > 1 && (
                <Button type="button" size="icon" variant="ghost" onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Qtd</Label>
                <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Preço unit. (R$)</Label>
                <Input type="number" min={0} step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setItems((p) => [...p, { productId: 0, quantity: 1, unitPrice: 0 }])}>
          <Plus className="h-4 w-4" />Adicionar camisa
        </Button>
      </div>

      {/* Payment */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Pagamento</Label>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pago">Pago ✓ (trava estoque)</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Forma</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{PAYMENT_LABELS[m]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label>Data da reserva</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <Label>Observações (opcional)</Label>
        <Input placeholder="Ex: cliente quer personalização, entrega..." value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {paymentStatus === "pago" && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700">
          ✓ As camisas disponíveis em estoque serão <strong>travadas automaticamente</strong> para esse cliente ao salvar
        </div>
      )}

      {/* Total */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-slate-500">Total da reserva</span>
        <span className="text-xl font-bold text-slate-800">{formatCurrency(total)}</span>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Criar Reserva"}</Button>
      </div>
    </form>
  );
}
