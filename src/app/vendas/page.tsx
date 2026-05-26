"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { SaleForm } from "@/components/vendas/SaleForm";
import { SaleHistory } from "@/components/vendas/SaleHistory";

export default function VendasPage() {
  const [open, setOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);

  function handleSuccess() {
    setOpen(false);
    setRefresh((n) => n + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vendas</h1>
          <p className="text-sm text-slate-500 mt-1">Registre e acompanhe suas vendas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />Nova Venda</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Registrar Venda</DialogTitle></DialogHeader>
            <SaleForm onSuccess={handleSuccess} onCancel={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <SaleHistory refresh={refresh} />
    </div>
  );
}
