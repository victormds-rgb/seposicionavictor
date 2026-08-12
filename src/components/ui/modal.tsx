"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Modal — Fase 2 (Design System FDE), prioridade 3.
 *
 * Generaliza o padrão `<dialog>` nativo que o `QuickCapture`
 * ((shell)/_components/quick-capture.tsx) já usava de forma isolada
 * — mesma base, agora reutilizável. `<dialog>` nativo dá foco preso,
 * fechar com Esc e camada de topo de graça, sem nenhuma lib de
 * portal/overlay.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
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
        "fde-pop-in w-full max-w-md rounded-lg border border-border-subtle bg-surface p-6 shadow-elevated backdrop:bg-ink-primary/40",
        className
      )}
    >
      {(title || description) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold text-ink-primary">{title}</h2>}
            {description && <p className="mt-1 text-sm text-ink-tertiary">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 rounded-md p-1 text-ink-tertiary transition-colors hover:bg-surface-sunken hover:text-ink-primary"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
      {children}
    </dialog>
  );
}
