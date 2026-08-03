/**
 * Domínio da Reuniao (Bounded Context Reuniões) — DOMAIN_MODEL.md.
 * Regras puras, sem I/O (CODING_GUIDELINES.md, seção 2 — Domain).
 */

export const STATUS_REUNIAO = ["agendada", "realizada", "processada", "cancelada"] as const;
export type StatusReuniao = (typeof STATUS_REUNIAO)[number];

export interface Reuniao {
  id: string;
  dataHora: Date;
  participantes: string[] | null;
  clienteId: string | null;
  projetoId: string | null;
  local: string | null;
  notasBrutas: string | null;
  status: StatusReuniao;
  metadata: Record<string, unknown> | null;
}

/** Invariante: só é possível marcar como realizada uma reunião ainda agendada. */
export function podeSerMarcadaComoRealizada(reuniao: Pick<Reuniao, "status">): boolean {
  return reuniao.status === "agendada";
}

/**
 * Invariante (DOMAIN_MODEL.md): "Uma Reuniao nunca é `processada` sem
 * RegistroBruto associado classificado." A verificação de que existe
 * um RegistroBruto classificado é feita na Application (cruza para o
 * Bounded Context Inbox) — esta função valida apenas a transição de
 * estado local, recebendo o resultado dessa verificação como parâmetro.
 */
export function podeSerProcessada(
  reuniao: Pick<Reuniao, "status">,
  temRegistroBrutoClassificado: boolean
): boolean {
  return reuniao.status === "realizada" && temRegistroBrutoClassificado;
}

export function podeSerCancelada(reuniao: Pick<Reuniao, "status">): boolean {
  return reuniao.status === "agendada" || reuniao.status === "realizada";
}
