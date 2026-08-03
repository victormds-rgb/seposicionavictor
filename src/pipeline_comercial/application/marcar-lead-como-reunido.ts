import type { LeadRepository } from "@/pipeline_comercial/domain/lead-repository";
import { podeSerMarcadoComoReunido } from "@/pipeline_comercial/domain/lead";

export class LeadNaoEncontradoError extends Error {}
export class TransicaoInvalidaError extends Error {}

/**
 * Use Case: acionado manualmente por Victor depois que a Reuniao
 * correspondente (Bounded Context Reuniões) foi marcada como
 * realizada — Pipeline Comercial não observa eventos do contexto
 * Reuniões automaticamente nesta Sprint (ver Riscos Arquiteturais do
 * relatório da Sprint 4).
 */
export async function marcarLeadComoReunido(
  leadId: string,
  deps: { leadRepository: LeadRepository }
) {
  const lead = await deps.leadRepository.buscarPorId(leadId);
  if (!lead) throw new LeadNaoEncontradoError(`Lead ${leadId} não encontrado.`);
  if (!podeSerMarcadoComoReunido(lead)) {
    throw new TransicaoInvalidaError(
      `Lead ${leadId} não pode ser marcado como reunido no status atual (${lead.statusComercial}).`
    );
  }

  await deps.leadRepository.atualizarStatusComercial(leadId, "reunido");
}
