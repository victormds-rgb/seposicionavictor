import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * `cn` — combina classes condicionais (`clsx`) e resolve conflitos de
 * utilitário Tailwind (`tailwind-merge`), ex.: `cn("p-2", condicao &&
 * "p-4")` sempre resulta em só um `p-*`. Ambas as dependências já
 * estavam instaladas (`package.json`) e nunca haviam sido usadas —
 * Fase 2 (Design System) é o primeiro consumidor.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
