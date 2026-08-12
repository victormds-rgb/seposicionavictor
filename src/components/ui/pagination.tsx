import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Pagination — Fase 2 (Design System FDE), prioridade 7.
 *
 * Server-renderável (sem "use client") — `buildHref` deixa cada
 * página decidir como montar a URL (preservando outros filtros de
 * query string, mesmo padrão já usado em Inbox/Pipeline/Alertas).
 *
 * Ainda não está aplicado a Conteúdo/Projetos (1151/215 itens sem
 * paginação, achado da sprint anterior) — essa é a prioridade real
 * declarada para a Fase 2-F, feita depois que o Design System for
 * validado isoladamente.
 */
export function Pagination({
  page,
  totalPages,
  buildHref,
  className,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  const linkBase =
    "inline-flex items-center gap-1 rounded-md border border-border-default px-3 py-1.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-sunken";

  return (
    <nav aria-label="Paginação" className={cn("flex items-center justify-between gap-3", className)}>
      <Link
        href={buildHref(prev)}
        aria-disabled={page <= 1}
        className={cn(linkBase, page <= 1 && "pointer-events-none opacity-40")}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Anterior
      </Link>
      <p className="text-sm text-ink-tertiary">
        Página <span className="font-medium text-ink-primary">{page}</span> de {totalPages}
      </p>
      <Link
        href={buildHref(next)}
        aria-disabled={page >= totalPages}
        className={cn(linkBase, page >= totalPages && "pointer-events-none opacity-40")}
      >
        Próxima
        <ChevronRight className="size-4" aria-hidden="true" />
      </Link>
    </nav>
  );
}
