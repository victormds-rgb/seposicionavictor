import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Um item da Navegação Global (Sprint 25 — Shell).
 * Extraído para não repetir a lógica de estado ativo/inativo 10x
 * dentro de global-navigation.tsx.
 */
export function NavLink({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`block whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isActive ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
      }`}
    >
      {children}
    </Link>
  );
}
