import { z } from "zod";
import type { LeadRepository } from "@/pipeline_comercial/domain/lead-repository";
import { podeSerQualificado } from "@/pipeline_comercial/domain/lead";
import type { Clock } from "@/shared/domain/clock";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class LeadNaoEncontradoError extends Error {}
export class TransicaoInvalidaError extends Error {}

const qualificarLeadSchema = z.object({
  leadId: z.string().uuid(),
  resumoQualificacao: z.string().trim().optional(),
  doresIdentificadas: z.array(z.string()).optional(),
  objecoes: z.string().trim().optional(),
  proximoPasso: z.string().trim().optional(),
});

export type QualificarLeadInput = z.infer<typeof qualificarLeadSchema>;

/**
 * Use Case: registrar a qualificação de um Lead (SOM Cap. 7.1 —
 * mesmos campos usados posteriormente na avaliação de Cliente).
 * Simplificação desta Sprint: uma única qualificação já move o
 * status_comercial diretamente para `qualificado` (em vez de um
 * estado intermediário `qualificando` sujeito a múltiplas edições) —
 * decisão de escopo para o MVP, documentada no relatório da Sprint 4.
 *
 * Sprint 42: qualificar É contato comercial real — captura respostas
 * de uma interação de verdade com o Lead — por isso atualiza
 * `ultimoContatoEm` (nunca via `updatedAt`; ver decisão documentada em
 * `pipeline_comercial/domain/lead-repository.ts`).
 */
export async function qualificarLead(
  inputBruto: unknown,
  deps: { leadRepository: LeadRepository; clock: Clock; eventPublisher?: IEventPublisher }
) {
  const input = qualificarLeadSchema.parse(inputBruto);

  const lead = await deps.leadRepository.buscarPorId(input.leadId);
  if (!lead) throw new LeadNaoEncontradoError(`Lead ${input.leadId} não encontrado.`);
  if (!podeSerQualificado(lead)) {
    throw new TransicaoInvalidaError(
      `Lead ${input.leadId} não pode ser qualificado no status atual (${lead.statusComercial}).`
    );
  }

  const qualificacao = await deps.leadRepository.criarQualificacao({
    leadId: input.leadId,
    resumoQualificacao: input.resumoQualificacao ?? null,
    doresIdentificadas: input.doresIdentificadas ?? null,
    objecoes: input.objecoes ?? null,
    proximoPasso: input.proximoPasso ?? null,
    documentosEnviados: null,
    linksRelevantes: null,
  });

  const agora = deps.clock.now();
  await deps.leadRepository.atualizarStatusComercial(input.leadId, "qualificado");
  await deps.leadRepository.registrarContato(input.leadId, agora);

  await deps.eventPublisher?.publicar({
    aggregate: "lead",
    aggregateId: input.leadId,
    eventName: "lead.qualificado",
    payload: { resumoQualificacao: input.resumoQualificacao ?? null },
    actorTipo: "humano",
    source: "pipeline_comercial.qualificar_lead",
  });

  return qualificacao;
}
