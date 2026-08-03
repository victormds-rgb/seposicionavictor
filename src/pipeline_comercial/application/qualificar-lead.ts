import { z } from "zod";
import type { LeadRepository } from "@/pipeline_comercial/domain/lead-repository";
import { podeSerQualificado } from "@/pipeline_comercial/domain/lead";

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
 */
export async function qualificarLead(inputBruto: unknown, deps: { leadRepository: LeadRepository }) {
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

  await deps.leadRepository.atualizarStatusComercial(input.leadId, "qualificado");

  return qualificacao;
}
