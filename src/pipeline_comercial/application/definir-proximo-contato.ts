import { z } from "zod";
import type { LeadRepository } from "@/pipeline_comercial/domain/lead-repository";
import { estaAtivo } from "@/pipeline_comercial/domain/lead";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class LeadNaoEncontradoError extends Error {}
export class TransicaoInvalidaError extends Error {}

const definirProximoContatoSchema = z.object({
  leadId: z.string().uuid(),
  proximoContatoEm: z.coerce.date(),
});

/**
 * Use Case: o usuário define quando deve falar com este Lead de novo
 * (Sprint 42 — mecanismo simples pedido na Sprint 41, item 5). Só faz
 * sentido para Leads ainda ativos no funil.
 */
export async function definirProximoContato(
  inputBruto: unknown,
  deps: { leadRepository: LeadRepository; eventPublisher?: IEventPublisher }
) {
  const input = definirProximoContatoSchema.parse(inputBruto);

  const lead = await deps.leadRepository.buscarPorId(input.leadId);
  if (!lead) throw new LeadNaoEncontradoError(`Lead ${input.leadId} não encontrado.`);
  if (!estaAtivo(lead)) {
    throw new TransicaoInvalidaError(
      `Lead ${input.leadId} já está resolvido (${lead.statusComercial}) — não faz sentido definir próximo contato.`
    );
  }

  await deps.leadRepository.definirProximoContato(input.leadId, input.proximoContatoEm);

  await deps.eventPublisher?.publicar({
    aggregate: "lead",
    aggregateId: input.leadId,
    eventName: "lead.proximo_contato_definido",
    payload: { proximoContatoEm: input.proximoContatoEm.toISOString() },
    actorTipo: "humano",
    source: "pipeline_comercial.definir_proximo_contato",
  });
}
