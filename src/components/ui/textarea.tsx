import type { TextareaHTMLAttributes } from "react";

/**
 * Textarea base do sistema (Sprint 25 — Shell). Mesma linguagem
 * visual de Input/Select — usado por qualquer tela com campo de
 * texto longo (Quick Capture, Conteúdo, Projetos/Build Log etc.).
 */
export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 ${className}`}
    />
  );
}
