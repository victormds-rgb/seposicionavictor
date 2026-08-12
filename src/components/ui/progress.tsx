import { cn } from "@/lib/cn";

/**
 * Progress — Fase 2 (Design System FDE), prioridade 10. Uso previsto:
 * barra de progresso do onboarding (Fase 4 do redesign de produto).
 */
export function Progress({
  value,
  max = 100,
  label,
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      {label && <p className="mb-1.5 text-xs font-medium text-ink-tertiary">{label}</p>}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
