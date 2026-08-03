import type { EventoDeDominio, IEventPublisher } from "@/shared/domain/i-event-publisher";
import type { IEventHandler } from "@/shared/domain/i-event-handler";

/**
 * Implementação de IEventPublisher que aciona handlers in-process
 * diretamente, sem broker/fila externa (ADR-002; ARCHITECTURE.md,
 * seção 10). A Application continua dependendo só da porta
 * IEventPublisher — nunca deste mecanismo concreto.
 */
export class InProcessEventDispatcher implements IEventPublisher {
  constructor(private readonly handlers: IEventHandler[]) {}

  async publicar(evento: EventoDeDominio): Promise<void> {
    for (const handler of this.handlers) {
      await handler.handle(evento);
    }
  }
}
