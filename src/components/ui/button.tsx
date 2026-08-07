"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes } from "react";

/**
 * Botão base do sistema (Sprint 24 — Primeira versão visual).
 *
 * Fica desabilitado durante o processamento de um Server Action pai
 * (via `useFormStatus`) — mesmo comportamento que `SubmitButton` já
 * tinha (Sprint 14), agora com estilo. `SubmitButton`
 * (`(shell)/_components/submit-button.tsx`) não foi tocado nesta
 * etapa — só a tela de Login usa este componente por enquanto.
 */
type ButtonVariant = "primary" | "secondary";

export function Button({
  variant = "primary",
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const { pending } = useFormStatus();

  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    secondary: "bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-50",
  };

  return (
    <button
      {...props}
      disabled={disabled ?? pending}
      className={`${base} ${variants[variant]} ${className}`}
    />
  );
}
