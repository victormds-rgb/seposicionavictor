import { executarMonitoramento } from "@/notificacoes/application/monitor-de-consistencia";
import { criarDependenciasDeNotificacoes } from "@/notificacoes/infrastructure/composicao";
import { SystemClock } from "@/shared/infrastructure/system-clock";

/**
 * Job: MonitorDeConsistencia (ARCHITECTURE.md, seções 7 e 12).
 *
 * Idempotente — `executarMonitoramento` só cria um novo Alerta quando
 * ainda não existe um ativo do mesmo tipo/entidade
 * (`garantirAlertaAtivo`); reexecutar não gera duplicidade.
 *
 * Independente de interface — não recebe nada de uma requisição HTTP
 * nem de um Server Component; monta suas próprias dependências.
 *
 * Chamável manualmente (`npm run jobs:run -- monitor-de-consistencia`)
 * e pronto para um scheduler externo futuro (Trigger.dev ou
 * equivalente) — esta função não importa nem depende de nenhuma
 * ferramenta de agendamento específica.
 */
export async function jobMonitorDeConsistencia() {
  const deps = criarDependenciasDeNotificacoes();
  return executarMonitoramento({ ...deps, clock: new SystemClock() });
}
