import { getDb } from "@infra/persistence/db/client";
import { eventLog } from "@infra/persistence/db/schema";
import type { EventoDeDominio } from "@/shared/domain/i-event-publisher";
import type { IEventHandler } from "@/shared/domain/i-event-handler";

/**
 * Handler de escrita do event_log — Sprint 0, adaptado para o Event
 * Dispatcher in-process (ADR-002) na etapa de Hardening.
 *
 * Infraestrutura pura: persiste o registro de observabilidade quando
 * acionado pelo InProcessEventDispatcher. event_log é um consumidor de
 * eventos entre outros possíveis, nunca o mecanismo de publicação —
 * a decisão de QUANDO um evento é emitido pertence exclusivamente à
 * Application (CODING_GUIDELINES.md, seção 6).
 *
 * Usa `getDb()` (não `db` diretamente) para participar automaticamente
 * da transação de uma `UnitOfWork` em andamento, quando houver — ver
 * `infra/persistence/db/unit-of-work.ts`.
 */
export class EventLogHandler implements IEventHandler {
  async handle(evento: EventoDeDominio): Promise<void> {
    await getDb().insert(eventLog).values({
      aggregate: evento.aggregate,
      aggregateId: evento.aggregateId,
      eventName: evento.eventName,
      payload: evento.payload,
      actorTipo: evento.actorTipo,
      actorId: evento.actorId,
      source: evento.source,
      correlationId: evento.correlationId,
    });
  }
}
