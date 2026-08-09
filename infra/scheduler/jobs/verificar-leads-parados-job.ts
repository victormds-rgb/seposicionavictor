import { verificarLeadsParados } from "@/notificacoes/application/monitor-comercial";
import { criarDependenciasDeNotificacoes } from "@/notificacoes/infrastructure/composicao";
import { SystemClock } from "@/shared/infrastructure/system-clock";

const clock = new SystemClock();

/**
 * Job: verificação de Lead parado (Sprint 42 — Fundação Comercial).
 * Mesmo padrão dos demais Jobs do Scheduler (idempotente, monta suas
 * próprias dependências, chamável manualmente ou por cron externo —
 * ver `infra/scheduler/jobs/monitor-de-consistencia-job.ts`).
 */
export async function jobVerificarLeadsParados() {
  const deps = criarDependenciasDeNotificacoes();
  return verificarLeadsParados({ ...deps, clock });
}
