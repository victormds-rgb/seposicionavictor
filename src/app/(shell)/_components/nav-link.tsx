import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/**
 * Um item da Navegação Global (Sprint 25 — Shell; ícone e estado
 * ativo mais evidente na Sprint de UX/UI, Fase 2; reskin para
 * "Graphite & Signal" no Checkpoint F — App Shell).
 *
 * Estado ativo deixou de ser um preenchimento sólido (`bg-zinc-900`)
 * — agora é uma leve tintura da cor primária + uma barra lateral,
 * linguagem definida na identidade visual aprovada (menos "botão
 * grande", mais "produto"). A barra existe sempre (transparente
 * quando inativo) para o texto não deslocar 2px ao ativar.
 */
export function NavLink({
  href,
  icon: Icon,
  isActive,
  children,
}: {
  href: string;
  icon?: LucideIcon;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`group flex items-center gap-2.5 whitespace-nowrap rounded-md border-l-2 px-2.5 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "border-primary bg-primary-tint text-primary"
          : "border-transparent text-ink-secondary hover:bg-surface-sunken hover:text-ink-primary"
      }`}
    >
      {Icon && (
        <Icon
          className={`size-4 shrink-0 ${isActive ? "text-primary" : "text-ink-tertiary group-hover:text-ink-secondary"}`}
          aria-hidden="true"
        />
      )}
      {children}
    </Link>
  );
}
