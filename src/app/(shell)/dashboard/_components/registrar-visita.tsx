"use client";

import { useEffect, useTransition } from "react";
import { registrarVisitaAoDashboardAction } from "../actions";

/**
 * Sprint 39 (Memória Executiva REAL) — dispara a atualização de
 * "última visita" só depois que o Dashboard já montou de verdade no
 * navegador. `useEffect` nunca roda durante o render do Server
 * Component (nem durante um prefetch de `<Link>`) — só depois que o
 * componente é hidratado num navegador real. Mesmo padrão do exemplo
 * oficial "ViewCount" da documentação do Next.js (mutating-data.md,
 * seção useEffect).
 *
 * Não renderiza nada visível — é só o gatilho da Server Action.
 */
export function RegistrarVisita() {
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      registrarVisitaAoDashboardAction();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
