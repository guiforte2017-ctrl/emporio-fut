"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Package, ShoppingCart, Shirt, Menu, X, Truck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart2 },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart },
  { href: "/pedidos", label: "Pedidos", icon: Truck },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {nav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onClick}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith(href)
              ? "bg-brand-700/40 text-brand-400"
              : "text-gray-400 hover:bg-surface-700 hover:text-gray-100"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-surface-600 bg-surface-900 px-4 md:hidden">
        <div className="flex items-center gap-2 text-brand-400 font-bold">
          <Shirt className="h-5 w-5" />
          Emporio Fut
        </div>
        <button onClick={() => setOpen(!open)} className="rounded-lg p-1.5 text-gray-400 hover:bg-surface-700">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed top-14 left-0 bottom-0 z-40 w-56 bg-surface-900 border-r border-surface-600 p-4 transition-transform md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavLinks onClick={() => setOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-56 shrink-0 flex-col border-r border-surface-600 bg-surface-900 p-4 sticky top-0 h-screen">
        <div className="mb-6 flex items-center gap-2 px-3">
          <Shirt className="h-5 w-5 text-brand-400" />
          <span className="font-bold text-gray-100 text-sm">Emporio Fut</span>
        </div>
        <NavLinks />
      </div>

      {/* Mobile top-bar spacer */}
      <div className="h-14 md:hidden" />
    </>
  );
}
