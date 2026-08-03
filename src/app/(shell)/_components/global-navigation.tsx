"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

/**
 * Navegação Global — Sprint 1 (Shell).
 *
 * Todos os itens sempre acessíveis por um único clique, sem submenu
 * de segundo nível (UI_UX.md, seção 2 — Navegação principal).
 * Sem identidade visual própria (DESIGN_SYSTEM.md não produzido
 * nesta fase) — apenas marcação semântica mínima.
 */
export function GlobalNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal">
      <ul>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
