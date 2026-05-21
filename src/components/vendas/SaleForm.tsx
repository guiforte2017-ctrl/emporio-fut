"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { formatCurrency, MODEL_LABELS, PAYMENT_LABELS, PAYMENT_METHODS } from "@/lib/utils";
import type { Product } from "@prisma/client";

interface SaleItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  product?: Product;
}

interface SaleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function SaleForm({ onSuccess, onCancel }: SaleFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<SaleItem[]>([{ productId: 0, quantity: 1, unitPrice: 0, costPrice: 0 }]);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [paymentStatus, setPaymentStatus] = useState("pago");
  const [customerName, setCustomerName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  function updateItem(idx: number, key: keyof SaleItem, value: number | string) {
    setItems((prev) => {
      const next = [...prev];
      if (key === "productId") {
        const prod = products.find((p) => p.id === Number(value));
        next[idx] = {
          ...next[idx],
          productId: Number(value),
          unitPrice: prod?.sellPrice ?? 0,
          costPrice: prod?.costPrice ?? 0,
          product: prod,
        };
      } else {
        next[idx] = { ...next[idx], [key]: Number(value) };
      }
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: 0, quantity: 1, unitPrice: 0, costPrice: 0 }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (items.some((i) => !i.productId)) {
      setError("Selecione o produto em todos os itens");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, paymentMethod, paymentStatus, customerName: customerName || null, date }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao registrar venda");
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
  }

  const availableProducts = products.filter((p) => p.quantity > 0);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Items */}
      <div className="flex flex-col gap-3">
        <Label>Itens da Venda</Label>
        {items.map((item, idx) => (
          <div key={idx} className="rounded-lg border border-surface-600 bg-surface-700 p-3 flex flex-col gap-2">
            <div className="flex gap-2 items-start">
              <div className="flex-1 min-w-0">
                <Select
                  value={item.productId ? String(item.productId) : ""}
                  onValueChange={(v) => updateItem(idx, "productId", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar camisa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.team} — {MODEL_LABELS[p.model]} {p.size} (est: {p.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {items.length > 1 && (
                <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(idx)}>
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Qtd</Label>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Preço unit. (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4" />Adicionar item
        </Button>
      </div>

      {/* Customer name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="customerName">Cliente (opcional)</Label>
        <Input
          id="customerName"
          placeholder="Nome do cliente..."
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
      </div>

      {/* Payment + status + date */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Forma de Pagamento</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>{PAYMENT_LABELS[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* Total */}
      <div className="rounded-lg bg-surface-700 border border-surface-500 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-400">Total da venda</span>
        <span className="text-xl font-bold text-brand-400">{formatCurrency(total)}</span>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Registrando..." : "Registrar Venda"}
        </Button>
      </div>
    </form>
  );
}
