import { cn } from "@/lib/cn";

/**
 * Skeleton — Fase 2 (Design System FDE), prioridade 6. Placeholder de
 * carregamento — só para onde já existe comportamento de loading real
 * (Fase 14 do redesign de UX/UI anterior segue valendo: não inventar
 * loading onde não há).
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-surface-sunken", className)}>
      <div
        style={{ animation: "fde-shimmer 1.6s ease-in-out infinite" }}
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
      />
    </div>
  );
}
