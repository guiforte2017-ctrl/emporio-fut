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
          default: "bg-surface-600 text-gray-200",
          success: "bg-brand-700 text-brand-100",
          warning: "bg-yellow-900 text-yellow-300",
          danger: "bg-red-900 text-red-300",
          outline: "border border-surface-500 text-gray-300",
        }[variant],
        className
      )}
      {...props}
    />
  );
}
