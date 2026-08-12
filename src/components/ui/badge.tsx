import type { ReactNode } from "react";

/**
 * Badge — pílula de status/tipo (Sprint 26). Reutilizável em
 * qualquer lugar do sistema com um rótulo de status curto (Lead,
 * Cliente, Projeto, Peça, Alerta etc. hoje mostram isso como texto
 * puro — este componente é o ponto de partida para padronizar).
 */
type BadgeVariant = "neutral" | "info" | "warning" | "danger" | "success";

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: "bg-zinc-100 text-zinc-700",
  info: "bg-blue-50 text-blue-700",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-700",
  success: "bg-emerald-100 text-emerald-700",
};

export function Badge({
  variant = "neutral",
  children,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${VARIANTS[variant]}`}
    >
      {children}
    </span>
  );
}
