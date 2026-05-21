"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { ORDER_STATUSES } from "./OrderStatusBadge";

interface OrderFormProps {
  initial?: Record<string, unknown>;
  onSuccess: () => void;
  onCancel: () => void;
}

const ORDER_TYPES = [
  "Amarela Torc", "Azul Torc", "Am + Az Torc",
  "Amarela FEM", "Azul FEM",
  "Am + Az Jogador", "Personalizado",
];

export function OrderForm({ initial, onSuccess, onCancel }: OrderFormProps) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    type:             (initial?.type as string)             ?? "",
    quantity:         (initial?.quantity as number)         ?? 8,
    value:            (initial?.value as number)            ?? 0,
    taxes:            (initial?.taxes as number | null)     ?? "",
    packagingCost:    (initial?.packagingCost as number | null) ?? "",
    orderDate:        initial?.orderDate
      ? new Date(initial.orderDate as string).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    trackingCode:     (initial?.trackingCode as string)     ?? "",
    sizes:            (initial?.sizes as string)            ?? "",
    payment:          (initial?.payment as string)          ?? "",
    status:           (initial?.status as string)           ?? "Informações enviadas",
    lastUpdate:       initial?.lastUpdate
      ? new Date(initial.lastUpdate as string).toISOString().slice(0, 10)
      : "",
    cpf:              (initial?.cpf as string)              ?? "",
    orderedBy:        (initial?.orderedBy as string)        ?? "",
    estimatedArrival: (initial?.estimatedArrival as string) ?? "",
    notes:            (initial?.notes as string)            ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isEdit ? `/api/orders/${initial!.id}` : "/api/orders";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        taxes: form.taxes !== "" ? Number(form.taxes) : null,
        packagingCost: form.packagingCost !== "" ? Number(form.packagingCost) : null,
        lastUpdate: form.lastUpdate || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao salvar");
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label>Tipo</Label>
          <Select value={form.type} onValueChange={(v) => set("type", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {ORDER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quantity">Qtd</Label>
          <Input id="quantity" type="number" min={1} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="value">Valor (R$)</Label>
          <Input id="value" type="number" min={0} step="0.01" value={form.value} onChange={(e) => set("value", e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="taxes">Impostos (R$)</Label>
          <Input id="taxes" type="number" min={0} step="0.01" value={form.taxes} onChange={(e) => set("taxes", e.target.value)} placeholder="Opcional" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="packagingCost">Embalagem (R$)</Label>
          <Input id="packagingCost" type="number" min={0} step="0.01" value={form.packagingCost} onChange={(e) => set("packagingCost", e.target.value)} placeholder="Opcional" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="orderDate">Data do Pedido</Label>
          <Input id="orderDate" type="date" value={form.orderDate} onChange={(e) => set("orderDate", e.target.value)} required />
        </div>

        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="trackingCode">Rastreio</Label>
          <Input id="trackingCode" value={form.trackingCode} onChange={(e) => set("trackingCode", e.target.value)} placeholder="LZ...CN" />
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="sizes">Tamanhos</Label>
          <Input id="sizes" value={form.sizes} onChange={(e) => set("sizes", e.target.value)} placeholder="ex: 2-S, 3-M, 2-L, 1-XL" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="payment">Pgto</Label>
          <Input id="payment" value={form.payment} onChange={(e) => set("payment", e.target.value)} placeholder="ex: Forte" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="orderedBy">De Quem</Label>
          <Input id="orderedBy" value={form.orderedBy} onChange={(e) => set("orderedBy", e.target.value)} placeholder="ex: João Pedro" />
        </div>

        <div className="col-span-2 flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" value={form.cpf} onChange={(e) => set("cpf", e.target.value)} placeholder="000.000.000-00" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="estimatedArrival">Previsão Chegada</Label>
          <Input id="estimatedArrival" value={form.estimatedArrival} onChange={(e) => set("estimatedArrival", e.target.value)} placeholder="ex: 11-13/mai" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastUpdate">Última Atualiz.</Label>
          <Input id="lastUpdate" type="date" value={form.lastUpdate} onChange={(e) => set("lastUpdate", e.target.value)} />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Salvando..." : isEdit ? "Salvar" : "Adicionar"}</Button>
      </div>
    </form>
  );
}
