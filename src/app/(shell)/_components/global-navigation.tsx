"use client";

import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "./nav-items";
import { NavLink } from "./nav-link";

/**
 * Navegação Global — Sprint 1 (Shell), agrupada por área na Sprint de
 * UX/UI (Fase 2), reskin "Graphite & Signal" no Checkpoint F.
 *
 * Um único modo (agrupado) usado tanto na sidebar desktop quanto
 * dentro do `NavDrawer` mobile — o modo `orientation="horizontal"`
 * (barra rolável achatada) foi removido: era uma versão comprimida do
 * desktop, exatamente o que o Checkpoint F pediu para não fazer.
 * Mobile agora recebe a mesma navegação agrupada, só que dentro de um
 * Drawer (ver `nav-drawer.tsx`).
 */
export function GlobalNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-2.5 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const isActive = !!pathname?.startsWith(item.href);
              return (
                <li key={item.href}>
                  <NavLink href={item.href} icon={item.icon} isActive={isActive}>
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
