import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  "Entregue":               "bg-green-900 text-green-300 border border-green-700",
  "Recebido BR":            "bg-yellow-900 text-yellow-300 border border-yellow-700",
  "Em transf (CWB-NAT)":   "bg-orange-900 text-orange-300 border border-orange-700",
  "Importação autorizada":  "bg-blue-900 text-blue-300 border border-blue-700",
  "Informações enviadas":   "bg-red-900 text-red-300 border border-red-700",
};

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  const style = STATUS_STYLES[status] ?? "bg-surface-600 text-gray-300 border border-surface-500";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", style, className)}>
      {status}
    </span>
  );
}

export const ORDER_STATUSES = Object.keys(STATUS_STYLES);
