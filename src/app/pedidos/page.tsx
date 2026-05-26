import { OrderTable } from "@/components/pedidos/OrderTable";

export default function PedidosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pedidos</h1>
        <p className="text-sm text-slate-500 mt-1">Acompanhe suas compras e importações</p>
      </div>
      <OrderTable />
    </div>
  );
}
