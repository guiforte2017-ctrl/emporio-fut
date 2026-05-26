import { ProductTable } from "@/components/estoque/ProductTable";

export default function EstoquePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Estoque</h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie seu catálogo de camisas</p>
      </div>
      <ProductTable />
    </div>
  );
}
