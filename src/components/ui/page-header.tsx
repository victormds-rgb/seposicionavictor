import type { ReactNode } from "react";

/**
 * PageHeader — título de página (Sprint 26; slot de ação principal e
 * reforço de hierarquia tipográfica na Sprint de UX/UI).
 *
 * Estrutura padrão de toda tela do Shell: título + descrição curta do
 * que a tela faz + (opcional) uma única ação principal alinhada à
 * direita — nunca mais de uma, para a ação continuar parecendo a
 * "óbvia" da tela (regra da Sprint de UX/UI, Fase 3).
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
