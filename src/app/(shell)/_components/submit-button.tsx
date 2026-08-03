"use client";

import { useFormStatus } from "react-dom";

/**
 * Botão de submit para formulários de escrita (Sprint 14 — Hardening
 * Final, item 7). Fica desabilitado durante o processamento — impede
 * duplo clique/submissão duplicada — sem alterar layout (mesmo
 * `<button type="submit">` de sempre, só com `disabled` amarrado ao
 * estado real do Server Action via `useFormStatus`).
 */
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {children}
    </button>
  );
}
