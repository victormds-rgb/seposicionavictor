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

// Sprint 42 (Fundação Comercial) — canal estruturado/agrupável de
// onde o Lead veio. `origemLead` (texto livre, já existente) continua
// existindo à parte para não perder o detalhe histórico já
// registrado; `canalOrigem` é o que permite agregações confiáveis
// ("qual canal converte melhor" — ver investigação da Sprint 41,
// pergunta D). Lista sugerida pela própria Sprint 42, mantendo a
// mesma convenção de todo enum já existente no domínio (minúsculo,
// sem acento — ver TEMPERATURAS_LEAD/STATUS_COMERCIAL acima).
export const CANAIS_ORIGEM_LEAD = [
  "instagram",
  "google",
  "whatsapp",
  "indicacao",
  "organico",
  "prospeccao",
  "site",
  "outro",
] as const;
export type CanalOrigemLead = (typeof CANAIS_ORIGEM_LEAD)[number];

export interface Lead {
  id: string;
  nome: string;
  origemLead: string | null;
  sdrResponsavel: string | null;
  temperatura: TemperaturaLead | null;
  ticketEstimado: number | null;
  statusComercial: StatusComercial;
  metadata: Record<string, unknown> | null;
  // Sprint 42 — todos novos, todos opcionais (registros existentes
  // continuam válidos sem eles; ver migration).
  canalOrigem: CanalOrigemLead | null;
  campanha: string | null;
  interesse: string | null;
  // Só escrito por ações que representam contato comercial real —
  // nunca por `updatedAt` nem por edição administrativa qualquer.
  // Ver `registrarContatoComLead` (application) para a lista exata de
  // ações que contam como contato.
  ultimoContatoEm: Date | null;
  proximoContatoEm: Date | null;
  motivoPerda: string | null;
  // Mesma exceção documentada já usada em `Projeto` (Sprint 39): único
  // timestamp técnico exposto no domínio, aqui necessário para
  // calcular tempo sem contato quando o Lead nunca foi contatado
  // (ver src/pipeline_comercial/domain/inteligencia-comercial.ts).
  criadoEm: Date;
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

/**
 * Sprint 42 — um Lead pode ser perdido a partir de qualquer estágio
 * ativo do funil (o negócio pode cair em qualquer ponto do caminho).
 * Excluído apenas quem já está resolvido: `convertido_cliente` (já
 * ganho, não faz sentido "perder" depois) e `perdido` (já perdido —
 * evita reescrever o motivo de perda por engano).
 */
export function podeSerMarcadoComoPerdido(lead: Pick<Lead, "statusComercial">): boolean {
  return lead.statusComercial !== "convertido_cliente" && lead.statusComercial !== "perdido";
}

/** Sprint 42 — estágios em que o Lead ainda está "em jogo" no funil. */
export function estaAtivo(lead: Pick<Lead, "statusComercial">): boolean {
  return lead.statusComercial !== "convertido_cliente" && lead.statusComercial !== "perdido";
}
