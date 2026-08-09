import { z } from "zod";
import type { LeadRepository } from "@/pipeline_comercial/domain/lead-repository";
import { podeSerMarcadoComoPerdido } from "@/pipeline_comercial/domain/lead";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class LeadNaoEncontradoError extends Error {}
export class TransicaoInvalidaError extends Error {}

const marcarLeadComoPerdidoSchema = z.object({
  leadId: z.string().uuid(),
  motivoPerda: z.string().trim().min(1, "Informe o motivo da perda."),
});

export type MarcarLeadComoPerdidoInput = z.infer<typeof marcarLeadComoPerdidoSchema>;

/**
 * Use Case: marcar um Lead como perdido (Sprint 42 — Fundação
 * Comercial). Fecha o gap identificado na Sprint 41: o status
 * `perdido` já existia no enum desde a Sprint 4, mas nenhum Use Case
 * levava um Lead até lá.
 *
 * Regras:
 * - Permitido a partir de qualquer estágio ativo (`podeSerMarcadoComoPerdido`
 *   — o negócio pode cair em qualquer ponto do funil), nunca a partir de
 *   `convertido_cliente` (já ganho) nem de `perdido` (já perdido).
 * - `motivoPerda` é obrigatório — perder sem motivo não alimenta a
 *   pergunta "por que estamos perdendo leads" (Sprint 41, seção D).
 * - Nunca apaga o Lead nem qualquer histórico associado (qualificação,
 *   agendamento) — só muda `statusComercial` e grava `motivoPerda`.
 */
export async function marcarLeadComoPerdido(
  inputBruto: unknown,
  deps: { leadRepository: LeadRepository; eventPublisher?: IEventPublisher }
) {
  const input = marcarLeadComoPerdidoSchema.parse(inputBruto);

  const lead = await deps.leadRepository.buscarPorId(input.leadId);
  if (!lead) throw new LeadNaoEncontradoError(`Lead ${input.leadId} não encontrado.`);
  if (!podeSerMarcadoComoPerdido(lead)) {
    throw new TransicaoInvalidaError(
      `Lead ${input.leadId} não pode ser marcado como perdido no status atual (${lead.statusComercial}).`
    );
  }

  await deps.leadRepository.marcarComoPerdido(input.leadId, input.motivoPerda);

  await deps.eventPublisher?.publicar({
    aggregate: "lead",
    aggregateId: input.leadId,
    eventName: "lead.perdido",
    payload: { motivoPerda: input.motivoPerda, statusAnterior: lead.statusComercial },
    actorTipo: "humano",
    source: "pipeline_comercial.marcar_lead_como_perdido",
  });
}
