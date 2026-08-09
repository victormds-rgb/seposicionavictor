import type { LeadRepository } from "@/pipeline_comercial/domain/lead-repository";
import { podeSerMarcadoComoReunido } from "@/pipeline_comercial/domain/lead";
import type { Clock } from "@/shared/domain/clock";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class LeadNaoEncontradoError extends Error {}
export class TransicaoInvalidaError extends Error {}

/**
 * Use Case: acionado manualmente por Victor depois que a Reuniao
 * correspondente (Bounded Context Reuniões) foi marcada como
 * realizada — Pipeline Comercial não observa eventos do contexto
 * Reuniões automaticamente nesta Sprint (ver Riscos Arquiteturais do
 * relatório da Sprint 4).
 *
 * Sprint 42: uma reunião realizada é o sinal mais forte de contato
 * real que existe no funil — atualiza `ultimoContatoEm`.
 */
export async function marcarLeadComoReunido(
  leadId: string,
  deps: { leadRepository: LeadRepository; clock: Clock; eventPublisher?: IEventPublisher }
) {
  const lead = await deps.leadRepository.buscarPorId(leadId);
  if (!lead) throw new LeadNaoEncontradoError(`Lead ${leadId} não encontrado.`);
  if (!podeSerMarcadoComoReunido(lead)) {
    throw new TransicaoInvalidaError(
      `Lead ${leadId} não pode ser marcado como reunido no status atual (${lead.statusComercial}).`
    );
  }

  await deps.leadRepository.atualizarStatusComercial(leadId, "reunido");
  await deps.leadRepository.registrarContato(leadId, deps.clock.now());

  await deps.eventPublisher?.publicar({
    aggregate: "lead",
    aggregateId: leadId,
    eventName: "lead.reunido",
    payload: {},
    actorTipo: "humano",
    source: "pipeline_comercial.marcar_lead_como_reunido",
  });
}
