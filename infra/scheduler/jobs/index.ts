import { jobMonitorDeConsistencia } from "./monitor-de-consistencia-job";
import { jobAtualizarItensVencidos } from "./atualizar-itens-vencidos-job";

/**
 * Registro central dos Jobs do Scheduler in-process (ARCHITECTURE.md,
 * seção 12: "Scheduler simples (cron-like), não orquestrador
 * complexo"). Cada Job é uma função assíncrona simples, independente
 * de interface e de ferramenta de agendamento — tanto o executor
 * manual (`run-job.ts`) quanto um scheduler externo futuro (Trigger.dev
 * ou equivalente) chamam exatamente a mesma função.
 *
 * Para adicionar um novo Job (ex.: sincronização de documento_oficial,
 * disparo de auditoria trimestral — já previstos no ARCHITECTURE.md,
 * seção 12, mas ainda não extraídos de nenhuma página), acrescente-o
 * a este registro.
 */
export const jobs = {
  "monitor-de-consistencia": jobMonitorDeConsistencia,
  "atualizar-itens-vencidos": jobAtualizarItensVencidos,
} as const;

export type NomeDoJob = keyof typeof jobs;
