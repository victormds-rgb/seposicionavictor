"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import type { Alerta } from "@/notificacoes/domain/alerta";
import { reconhecerAlertaAction } from "../alertas/actions";

// Mesmo mapeamento de `alertas/page.tsx` — duplicado de propósito (só
// 5 linhas) em vez de extraído para um módulo compartilhado: o
// Checkpoint F pede para não tocar no conteúdo de `/alertas`, e um
// import cruzado ali criaria acoplamento que essa etapa não pediu.
// Centralizar isso é candidato natural para quando `/alertas` for
// redesenhada de verdade.
const ROTULOS_TIPO_ALERTA: Record<string, string> = {
  build_log_ausente: "Build Log ausente",
  auditoria_devida: "Auditoria devida",
  desvio_pilares: "Desvio de pilares",
  drift_critico: "Drift crítico",
  lead_parado: "Lead parado",
};

/**
 * Painel de Alertas no topbar — Checkpoint F (App Shell), item 5.
 *
 * O domínio `Alerta` (`src/notificacoes/`) continua a única fonte de
 * verdade — nada aqui cria estado novo, só apresenta o que
 * `listarAlertas({ status: "ativo" })` já retorna (mesma chamada que
 * o Dashboard já fazia) e reaproveita `reconhecerAlertaAction`
 * (`alertas/actions.ts`) para a ação rápida.
 *
 * O dourado (`accent`) aparece só no badge de contagem — é a única
 * leitura de "isto merece atenção" no shell inteiro, por decisão
 * explícita da identidade visual aprovada.
 */
export function PainelAlertas({ alertas }: { alertas: Alerta[] }) {
  const emDestaque = alertas.slice(0, 5);

  return (
    <Dropdown
      align="end"
      trigger={
        <button
          type="button"
          aria-label={`Alertas ativos (${alertas.length})`}
          className="relative rounded-md p-2 text-ink-secondary transition-colors hover:bg-surface-sunken hover:text-ink-primary"
        >
          <Bell className="size-5" aria-hidden="true" />
          {alertas.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
              {alertas.length > 9 ? "9+" : alertas.length}
            </span>
          )}
        </button>
      }
      className="w-80"
    >
      <div className="flex items-center justify-between px-2.5 py-2">
        <p className="text-sm font-semibold text-ink-primary">Alertas ativos</p>
        <span className="text-xs text-ink-tertiary">{alertas.length}</span>
      </div>

      {emDestaque.length === 0 ? (
        <p className="px-2.5 py-4 text-center text-sm text-ink-tertiary">
          Nada pedindo sua atenção agora.
        </p>
      ) : (
        <ul className="space-y-1 px-1">
          {emDestaque.map((alerta) => (
            <li key={alerta.id} className="rounded-sm px-1.5 py-2 hover:bg-surface-sunken">
              <p className="text-xs font-medium text-accent-foreground">
                <span className="rounded-sm bg-accent-tint px-1.5 py-0.5 text-accent-foreground">
                  {ROTULOS_TIPO_ALERTA[alerta.tipo] ?? alerta.tipo}
                </span>
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-ink-secondary">{alerta.condicaoGatilho}</p>
              <form action={reconhecerAlertaAction} className="mt-1.5">
                <input type="hidden" name="alertaId" value={alerta.id} />
                <button
                  type="submit"
                  className="text-xs font-medium text-primary transition-colors hover:text-primary-hover"
                >
                  Reconhecer
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-1 border-t border-border-subtle px-2.5 pt-2">
        <Link href="/alertas" className="text-sm font-medium text-primary hover:text-primary-hover">
          Ver todos os alertas →
        </Link>
      </div>
    </Dropdown>
  );
}
