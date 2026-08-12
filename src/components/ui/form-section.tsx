import type { ReactNode } from "react";

/**
 * FormSection — agrupamento de campos relacionados dentro de um
 * formulário maior (Sprint de UX/UI, Fase 1 — "Formulários": um
 * `<fieldset>` com título curto, para separar visualmente blocos como
 * "Informações básicas" / "Qualificação" / "Comercial" no formulário
 * de Novo Lead, em vez de uma coluna única de campos sem nenhuma
 * pausa visual entre eles.
 */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-zinc-100 pt-4 first:border-0 first:pt-0">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}
