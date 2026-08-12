"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Toast — Fase 2 (Design System FDE), prioridade 5.
 *
 * Contexto simples (sem lib nova) para feedback transitório de ações
 * importantes — ex.: Fase 8 do redesign ("🎉 Seu primeiro cliente foi
 * cadastrado"). `<ToastProvider>` ainda não está no App Shell real —
 * isso é Fase 2-F; por ora só a página de demonstração o consome.
 */
type ToastVariant = "success" | "warning" | "danger" | "info";
type ToastInput = { title: string; description?: string; variant?: ToastVariant };
type ToastItem = ToastInput & { id: string; variant: ToastVariant };

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

const ICONS: Record<ToastVariant, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
};

const TONS: Record<ToastVariant, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { ...input, id, variant: input.variant ?? "info" }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              style={{ animation: "fde-fade-in 220ms ease-out" }}
              className="pointer-events-auto flex items-start gap-3 rounded-md border border-border-subtle bg-surface p-4 shadow-elevated"
            >
              <Icon className={cn("mt-0.5 size-4 shrink-0", TONS[t.variant])} aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-primary">{t.title}</p>
                {t.description && <p className="mt-0.5 text-sm text-ink-tertiary">{t.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Fechar"
                className="shrink-0 text-ink-tertiary hover:text-ink-primary"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  return toast;
}
