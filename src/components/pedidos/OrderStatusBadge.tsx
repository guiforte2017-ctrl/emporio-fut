import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  "Entregue":               "bg-green-100 text-green-700 border border-green-200",
  "Recebido BR":            "bg-amber-100 text-amber-700 border border-amber-200",
  "Em transf (CWB-NAT)":   "bg-orange-100 text-orange-700 border border-orange-200",
  "Importação autorizada":  "bg-blue-100 text-blue-700 border border-blue-200",
  "Informações enviadas":   "bg-slate-100 text-slate-600 border border-slate-200",
};

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600 border border-slate-200";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", style, className)}>
      {status}
    </span>
  );
}

export const ORDER_STATUSES = Object.keys(STATUS_STYLES);
