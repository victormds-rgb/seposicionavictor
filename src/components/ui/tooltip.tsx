import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Tooltip — Fase 2 (Design System FDE), prioridade 9. CSS puro
 * (`group-hover`/`group-focus-within`) — sem lib de posicionamento.
 * ponytail: sem detecção de colisão com a borda da viewport; se algum
 * dia isso importar de verdade, revisitar com CSS anchor positioning.
 */
export function Tooltip({
  label,
  children,
  side = "top",
}: {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom";
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-sm bg-ink-primary px-2 py-1 text-xs font-medium text-surface opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
          side === "top" ? "bottom-full left-1/2 mb-1.5 -translate-x-1/2" : "top-full left-1/2 mt-1.5 -translate-x-1/2"
        )}
      >
        {label}
      </span>
    </span>
  );
}
