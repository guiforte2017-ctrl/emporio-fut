"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Package, ShoppingCart, Shirt, Menu, X, Truck, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart2 },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart },
  { href: "/reservas", label: "Reservas", icon: BookmarkCheck },
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
              ? "bg-brand-600/20 text-brand-400 border border-brand-600/30"
              : "text-blue-100/70 hover:bg-white/10 hover:text-white"
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
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-navy-700 bg-navy-800 px-4 md:hidden">
        <div className="flex items-center gap-2 text-white font-bold">
          <Shirt className="h-5 w-5 text-brand-400" />
          <span>Emporio <span className="text-brand-400">Fut</span></span>
        </div>
        <button onClick={() => setOpen(!open)} className="rounded-lg p-1.5 text-blue-100/70 hover:bg-white/10 hover:text-white">
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
          "fixed top-14 left-0 bottom-0 z-40 w-56 bg-navy-800 border-r border-navy-700 p-4 transition-transform md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavLinks onClick={() => setOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-56 shrink-0 flex-col border-r border-navy-700 bg-navy-800 p-4 sticky top-0 h-screen">
        <div className="mb-6 flex items-center gap-2 px-3">
          <Shirt className="h-5 w-5 text-brand-400" />
          <span className="font-bold text-white text-sm">
            Emporio <span className="text-brand-400">Fut</span>
          </span>
        </div>
        <NavLinks />
        <div className="mt-auto px-3 pb-2">
          <p className="text-xs text-blue-100/30">Copa 2026</p>
        </div>
      </div>

      {/* Mobile top-bar spacer */}
      <div className="h-14 md:hidden" />
    </>
  );
}
