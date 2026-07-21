"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Drawer lateral (direita) sem dependências externas.
 * Fecha no ESC, no clique fora e no X. Trava o scroll do body enquanto aberto.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  // Mantém o componente montado durante a animação de saída.
  const [render, setRender] = React.useState(open);
  const [leaving, setLeaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setRender(true);
      setLeaving(false);
    } else if (render) {
      setLeaving(true);
      const t = setTimeout(() => setRender(false), 200);
      return () => clearTimeout(t);
    }
  }, [open, render]);

  React.useEffect(() => {
    if (!render) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [render, onClose]);

  if (!render) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/60 duration-200 ${
          leaving ? "animate-out fade-out" : "animate-in fade-in"
        }`}
        onClick={onClose}
        aria-hidden
      />
      {/* Painel */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex h-full w-full max-w-[540px] flex-col border-l border-border bg-elevated shadow-2xl duration-200 ${
          leaving
            ? "animate-out slide-out-to-right"
            : "animate-in slide-in-from-right"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-foreground">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Classes compartilhadas dos controles de formulário (input/select/textarea). */
export const controlClass = cn(
  "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground",
  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
  "disabled:opacity-60"
);

/** Rótulo + controle empilhados. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
