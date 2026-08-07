import type { InputHTMLAttributes } from "react";

/**
 * Input base do sistema (Sprint 24 — Primeira versão visual).
 * Sem lógica própria — só estilo consistente com Button/Card.
 */
export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 ${className}`}
    />
  );
}
