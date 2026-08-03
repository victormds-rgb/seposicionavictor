import { z } from "zod";
import type { LeadRepository } from "@/pipeline_comercial/domain/lead-repository";
import { TEMPERATURAS_LEAD } from "@/pipeline_comercial/domain/lead";

const criarLeadSchema = z.object({
  nome: z.string().trim().min(1),
  origemLead: z.string().trim().optional(),
  sdrResponsavel: z.string().trim().optional(),
  temperatura: z.enum(TEMPERATURAS_LEAD).optional(),
  ticketEstimado: z.number().positive().optional(),
});

export type CriarLeadInput = z.infer<typeof criarLeadSchema>;

/**
 * Use Case: criar um Lead — primeiro contato do fluxo comercial
 * (ARCHITECTURE.md, seção 20). Nenhum evento de domínio é emitido
 * aqui: a lista fechada de 21 eventos (DOMAIN_MODEL.md) não inclui
 * eventos de Lead — lacuna já sinalizada no relatório da Sprint 4.
 */
export async function criarLead(inputBruto: unknown, deps: { leadRepository: LeadRepository }) {
  const input = criarLeadSchema.parse(inputBruto);

  return deps.leadRepository.criar({
    nome: input.nome,
    origemLead: input.origemLead ?? null,
    sdrResponsavel: input.sdrResponsavel ?? null,
    temperatura: input.temperatura ?? null,
    ticketEstimado: input.ticketEstimado ?? null,
    statusComercial: "novo",
    metadata: null,
  });
}
