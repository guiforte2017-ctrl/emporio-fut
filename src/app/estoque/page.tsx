import { ProductTable } from "@/components/estoque/ProductTable";

export default function EstoquePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Estoque</h1>
        <p className="text-sm text-gray-400 mt-1">Gerencie seu catálogo de camisas</p>
      </div>
      <ProductTable />
    </div>
  );
}
