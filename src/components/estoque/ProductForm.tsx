"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { SIZES, MODELS, MODEL_LABELS } from "@/lib/utils";

interface ProductFormProps {
  initial?: {
    id?: number;
    team?: string;
    model?: string;
    size?: string;
    quantity?: number;
    costPrice?: number;
    sellPrice?: number;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ initial, onSuccess, onCancel }: ProductFormProps) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    team: initial?.team ?? "",
    model: initial?.model ?? "",
    size: initial?.size ?? "",
    quantity: initial?.quantity ?? 0,
    costPrice: initial?.costPrice ?? 0,
    sellPrice: initial?.sellPrice ?? 0,
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

    const url = isEdit ? `/api/products/${initial!.id}` : "/api/products";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="team">Time</Label>
          <Input
            id="team"
            placeholder="ex: Flamengo"
            value={form.team}
            onChange={(e) => set("team", e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Modelo</Label>
          <Select value={form.model} onValueChange={(v) => set("model", v)} required>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {MODELS.map((m) => (
                <SelectItem key={m} value={m}>{MODEL_LABELS[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Tamanho</Label>
          <Select value={form.size} onValueChange={(v) => set("size", v)} required>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {SIZES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quantity">Quantidade</Label>
          <Input
            id="quantity"
            type="number"
            min={0}
            value={form.quantity}
            onChange={(e) => set("quantity", Number(e.target.value))}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
          <Input
            id="costPrice"
            type="number"
            min={0}
            step="0.01"
            value={form.costPrice}
            onChange={(e) => set("costPrice", Number(e.target.value))}
            required
          />
        </div>

        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="sellPrice">Preço de Venda (R$)</Label>
          <Input
            id="sellPrice"
            type="number"
            min={0}
            step="0.01"
            value={form.sellPrice}
            onChange={(e) => set("sellPrice", Number(e.target.value))}
            required
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}
