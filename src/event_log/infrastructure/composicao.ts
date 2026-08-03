import { InProcessEventDispatcher } from "@/shared/infrastructure/in-process-event-dispatcher";
import { EventLogHandler } from "@/event_log/infrastructure/eventLogRepository";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

/**
 * Registro central de handlers do Event Dispatcher in-process
 * (ADR-002). Todo Bounded Context injeta `IEventPublisher` via esta
 * fábrica — nunca instancia `InProcessEventDispatcher` diretamente —
 * para que o registro de handlers permaneça em um único lugar.
 *
 * Para adicionar um novo handler (ex.: futuro listener de
 * Notificações ou Agents), basta acrescentá-lo à lista abaixo; nenhum
 * Use Case ou composition root de outro contexto precisa mudar.
 */
export function criarEventDispatcher(): IEventPublisher {
  return new InProcessEventDispatcher([new EventLogHandler()]);
}
