import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        {
          default: "bg-slate-100 text-slate-700",
          success: "bg-green-100 text-green-700",
          warning: "bg-amber-100 text-amber-700",
          danger:  "bg-red-100 text-red-700",
          outline: "border border-slate-300 text-slate-600",
        }[variant],
        className
      )}
      {...props}
    />
  );
}
