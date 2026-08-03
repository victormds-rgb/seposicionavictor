/**
 * Domínio do Lead (Bounded Context Pipeline Comercial) — DOMAIN_MODEL.md,
 * DATABASE.md (refinamento pré-ARCHITECTURE, item 5), ARCHITECTURE.md
 * seção 20, ADR-006.
 */

export const TEMPERATURAS_LEAD = ["frio", "morno", "quente"] as const;
export type TemperaturaLead = (typeof TEMPERATURAS_LEAD)[number];

export const STATUS_COMERCIAL = [
  "novo",
  "qualificando",
  "qualificado",
  "agendado",
  "reunido",
  "convertido_cliente",
  "perdido",
] as const;
export type StatusComercial = (typeof STATUS_COMERCIAL)[number];

export interface Lead {
  id: string;
  nome: string;
  origemLead: string | null;
  sdrResponsavel: string | null;
  temperatura: TemperaturaLead | null;
  ticketEstimado: number | null;
  statusComercial: StatusComercial;
  metadata: Record<string, unknown> | null;
}

export function podeSerQualificado(lead: Pick<Lead, "statusComercial">): boolean {
  return lead.statusComercial === "novo" || lead.statusComercial === "qualificando";
}

export function podeSerAgendado(lead: Pick<Lead, "statusComercial">): boolean {
  return lead.statusComercial === "qualificado";
}

export function podeSerMarcadoComoReunido(lead: Pick<Lead, "statusComercial">): boolean {
  return lead.statusComercial === "agendado";
}

/**
 * Invariante (ADR-006): a conversão só é possível a partir de um Lead
 * que já passou pela reunião — nunca se "promove" um Lead novo
 * diretamente a Cliente sem qualificação e contato real.
 */
export function podeSerConvertido(lead: Pick<Lead, "statusComercial">): boolean {
  return lead.statusComercial === "reunido";
}
