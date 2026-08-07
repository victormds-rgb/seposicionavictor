import type { ReactNode } from "react";

/**
 * FormField — rótulo + controle (Sprint 25 — Shell).
 * Elimina a duplicação de `<label><span className="...">Rótulo</span>
 * <Input/></label>` que já existia na tela de Login e se repetiria em
 * toda tela com formulário daqui em diante.
 */
export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}
