"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";

/**
 * Navegação Global — Sprint 1 (Shell), estilo Sprint 25.
 *
 * Todos os itens sempre acessíveis por um único clique, sem submenu
 * de segundo nível (UI_UX.md, seção 2 — Navegação principal).
 *
 * `orientation="vertical"` (padrão) é usada na sidebar desktop;
 * `orientation="horizontal"` é a mesma lista, mesma lógica de estado
 * ativo, só disposta em linha — usada na barra mobile
 * ((shell)/layout.tsx) para não duplicar o `NAV_ITEMS.map`.
 */
export function GlobalNavigation({
  orientation = "vertical",
}: {
  orientation?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal">
      <ul className={orientation === "vertical" ? "flex flex-col gap-0.5" : "flex gap-1"}>
        {NAV_ITEMS.map((item) => {
          const isActive = !!pathname?.startsWith(item.href);
          return (
            <li key={item.href} className={orientation === "horizontal" ? "shrink-0" : undefined}>
              <NavLink href={item.href} isActive={isActive}>
                {item.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
