import type { HTMLAttributes } from "react";

/**
 * Card base do sistema (Sprint 24 — Primeira versão visual).
 * Container neutro: borda sutil, cantos arredondados, sem sombra
 * chamativa — mesma linguagem visual de Linear/Vercel/GitHub.
 */
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`rounded-lg border border-zinc-200 bg-white p-6 shadow-sm ${className}`}
    />
  );
}
