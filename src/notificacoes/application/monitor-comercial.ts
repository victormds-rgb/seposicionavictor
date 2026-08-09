import type { AlertaRepository } from "@/notificacoes/domain/notificacoes-repository";
import type { LeadRepository } from "@/pipeline_comercial/domain/lead-repository";
import { leadEstaParado, LIMITE_HORAS_LEAD_PARADO } from "@/pipeline_comercial/domain/inteligencia-comercial";
import { garantirAlertaAtivo } from "@/notificacoes/application/monitor-de-consistencia";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";
import type { Clock } from "@/shared/domain/clock";
import type { UnitOfWork } from "@/shared/domain/unit-of-work";

/**
 * Monitor Comercial (Sprint 42 — Fundação Comercial) — mesmo padrão
 * de `notificacoes/application/monitor-de-consistencia.ts`, em
 * arquivo separado por ser uma verificação de natureza diferente
 * (pipeline comercial, não consistência de conteúdo/build). Reaproveita
 * `garantirAlertaAtivo` (idempotente por natureza: índice único parcial
 * `(tipo, entidade_relacionada_id) WHERE status = 'ativo'`) — nenhum
 * mecanismo novo de alerta foi criado.
 *
 * Definição de "parado" (ver `pipeline_comercial/domain/inteligencia-comercial.ts`
 * para a regra completa): mais de 48h sem contato real, exceto
 * `agendado`/`convertido_cliente`/`perdido`.
 *
 * Como o alerta deixa de ser relevante: `lead_parado` não é
 * auto-resolvido por este Job (mesmo comportamento que os outros 3
 * tipos de alerta já têm hoje — nenhum é auto-resolvido por nenhum
 * Job existente) — fica "ativo" até o usuário resolver manualmente
 * pela tela de Alertas (`resolverAlerta`, já genérico e já permite
 * qualquer tipo exceto `build_log_ausente`). Reexecutar o Job não
 * duplica: se o lead já tem um `lead_parado` ativo, `garantirAlertaAtivo`
 * não cria outro.
 */
export async function verificarLeadsParados(deps: {
  leadRepository: LeadRepository;
  alertaRepository: AlertaRepository;
  eventPublisher?: IEventPublisher;
  clock: Clock;
  unitOfWork?: UnitOfWork;
}) {
  const agora = deps.clock.now();
  const leads = await deps.leadRepository.listar({});

  const alertasGerados = [];
  for (const lead of leads) {
    if (!leadEstaParado(lead, agora)) continue;

    const alerta = await garantirAlertaAtivo(
      "lead_parado",
      `Lead "${lead.nome}" sem contato há mais de ${LIMITE_HORAS_LEAD_PARADO}h.`,
      "lead",
      lead.id,
      {
        alertaRepository: deps.alertaRepository,
        eventPublisher: deps.eventPublisher,
        clock: deps.clock,
        unitOfWork: deps.unitOfWork,
      }
    );
    alertasGerados.push(alerta);
  }
  return alertasGerados;
}
