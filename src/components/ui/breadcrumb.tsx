import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

/**
 * Breadcrumb — Fase 2 (Design System FDE), prioridade 12.
 */
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-ink-tertiary">
      {items.map((item, i) => (
        <Fragment key={item.label}>
          {i > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-ink-primary">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="font-medium text-ink-primary">
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
