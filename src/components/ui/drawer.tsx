"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Drawer — Fase 2 (Design System FDE), prioridade 8. Mesma base de
 * `<dialog>` nativo do Modal, deslizando da direita em vez de
 * fade+escala centralizado — uso típico: detalhe de um item sem sair
 * da lista (progressive disclosure, Fase 9 do redesign de produto).
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={title}
      className={cn(
        "fde-slide-in m-0 ml-auto h-dvh max-h-none w-full max-w-md overflow-y-auto rounded-none border-l border-border-subtle bg-surface p-6 shadow-elevated backdrop:bg-ink-primary/40",
        className
      )}
    >
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1 text-ink-tertiary transition-colors hover:bg-surface-sunken hover:text-ink-primary"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
      {children}
    </dialog>
  );
}
