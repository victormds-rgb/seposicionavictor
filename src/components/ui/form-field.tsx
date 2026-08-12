import type { ReactNode } from "react";

/**
 * FormField — rótulo + controle (Sprint 25 — Shell; suporte a texto
 * de ajuda/erro na Sprint de UX/UI, Fase 1 — "Formulários": todo
 * campo precisa de um jeito consistente de mostrar erro sem o layout
 * pular ou o campo ficar "solto" da mensagem).
 */
export function FormField({
  label,
  help,
  error,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
      {help && !error && <span className="mt-1 block text-xs text-zinc-500">{help}</span>}
      {error && (
        <span role="alert" className="mt-1 block text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
