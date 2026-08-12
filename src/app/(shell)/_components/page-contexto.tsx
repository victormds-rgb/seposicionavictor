"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

/**
 * Contexto de página no topbar — Checkpoint F (App Shell). Reaproveita
 * a mesma lista `NAV_ITEMS` (rótulo + href) que já decide o estado
 * ativo da sidebar, em vez de manter um segundo mapeamento de título
 * por rota — uma única fonte de verdade para "onde eu estou".
 */
export function PageContexto() {
  const pathname = usePathname();
  const atual = NAV_ITEMS.find((item) => pathname?.startsWith(item.href));

  if (!atual) return null;

  return <p className="text-sm font-medium text-ink-primary">{atual.label}</p>;
}
