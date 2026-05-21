"use client";

import * as Toast from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { createContext, useContext, useState, useCallback } from "react";

type ToastType = { id: string; title: string; description?: string; variant?: "default" | "destructive" };

const ToastContext = createContext<{
  toast: (opts: Omit<ToastType, "id">) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const toast = useCallback((opts: Omit<ToastType, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...opts, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <Toast.Provider swipeDirection="right">
        {toasts.map((t) => (
          <Toast.Root
            key={t.id}
            open
            className={`fixed bottom-4 right-4 z-[100] flex w-80 items-start gap-3 rounded-xl border p-4 shadow-xl ${
              t.variant === "destructive"
                ? "border-red-800 bg-red-950 text-red-100"
                : "border-surface-500 bg-surface-700 text-gray-100"
            }`}
          >
            <div className="flex-1 min-w-0">
              <Toast.Title className="text-sm font-semibold">{t.title}</Toast.Title>
              {t.description && (
                <Toast.Description className="mt-1 text-xs text-gray-400">{t.description}</Toast.Description>
              )}
            </div>
            <Toast.Close className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-100">
              <X className="h-4 w-4" />
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}
