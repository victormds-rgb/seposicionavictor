import type { EventoDeDominio } from "./i-event-publisher";

export interface IEventHandler {
  handle(evento: EventoDeDominio): Promise<void>;
}
