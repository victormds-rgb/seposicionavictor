import type { ReactNode } from "react";

/**
 * Section — bloco de conteúdo com título (Sprint 26; suporte a
 * `className` na Sprint de UX/UI para permitir peso visual diferente
 * entre seções de uma mesma página — ex.: Dashboard, onde nem tudo
 * deve competir pela mesma atenção). Substitui o padrão repetido
 * `<section aria-labelledby="x"><h2 id="x">...</h2>...</section>`
 * que existia em cada bloco do Dashboard — mesmo padrão para qualquer
 * tela futura.
 */
export function Section({
  title,
  action,
  className = "",
  children,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className={`rounded-lg border border-zinc-200 bg-white p-5 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
