import type { SelectHTMLAttributes } from "react";

/**
 * Select base do sistema (Sprint 25 — Shell). Mesma linguagem visual
 * de Input/Button — reaproveitado em qualquer tela com campo de
 * seleção nativo (Pipeline, Conteúdo, Projetos, Quick Capture etc.).
 */
export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 ${className}`}
    />
  );
}
