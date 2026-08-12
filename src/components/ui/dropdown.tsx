"use client";

import { cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Dropdown — Fase 2 (Design System FDE), prioridade 4.
 *
 * Fechar-ao-clicar-fora e Esc via um único listener de documento
 * (não via Popover API nativa): um elemento `[popover]` é promovido à
 * "top layer" quando aberto, e nesse estado seu *containing block*
 * para `position: absolute` passa a ser o viewport, não o wrapper
 * `relative` — o painel não se ancora sob o trigger de forma
 * confiável entre navegadores. Verificado empiricamente (screenshot
 * do Checkpoint F mostrando o painel simplesmente não aparecia).
 * `position: absolute` comum, sem top layer, ancora sempre certo.
 */
export function Dropdown({
  trigger,
  children,
  align = "start",
  className,
}: {
  trigger: ReactElement<{ onClick?: () => void }>;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function fechar(event: PointerEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent) {
        if (event.key === "Escape") setOpen(false);
        return;
      }
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", fechar);
    document.addEventListener("keydown", fechar);
    return () => {
      document.removeEventListener("pointerdown", fechar);
      document.removeEventListener("keydown", fechar);
    };
  }, [open]);

  const triggerComToggle = isValidElement(trigger)
    ? cloneElement(trigger, { onClick: () => setOpen((v) => !v) })
    : trigger;

  return (
    <div ref={ref} className="relative inline-block">
      {triggerComToggle}
      {open && (
        <div
          style={{ animation: "fde-fade-in 160ms ease-out" }}
          className={cn(
            "absolute top-full z-50 mt-2 min-w-48 rounded-md border border-border-subtle bg-surface p-1 shadow-elevated",
            align === "end" ? "right-0" : "left-0",
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  danger,
  icon: Icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm transition-colors",
        danger ? "text-danger hover:bg-danger-tint" : "text-ink-primary hover:bg-surface-sunken"
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
      {children}
    </button>
  );
}
