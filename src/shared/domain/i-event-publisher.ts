export interface EventoDeDominio {
  aggregate: string;
  aggregateId: string;
  eventName: string;
  payload: Record<string, unknown>;
  actorTipo: "humano" | "ia" | "sistema";
  actorId?: string;
  source?: string;
  correlationId?: string;
}

export interface IEventPublisher {
  publicar(evento: EventoDeDominio): Promise<void>;
}
