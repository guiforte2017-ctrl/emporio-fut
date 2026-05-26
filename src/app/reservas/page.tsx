import { ReservaTable } from "@/components/reservas/ReservaTable";

export default function ReservasPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reservas</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pedidos antecipados — trava estoque automaticamente quando pago
        </p>
      </div>
      <ReservaTable />
    </div>
  );
}
