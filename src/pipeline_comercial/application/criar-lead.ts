import { z } from "zod";
import type { LeadRepository } from "@/pipeline_comercial/domain/lead-repository";
import { TEMPERATURAS_LEAD, CANAIS_ORIGEM_LEAD } from "@/pipeline_comercial/domain/lead";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

const criarLeadSchema = z.object({
  nome: z.string().trim().min(1),
  origemLead: z.string().trim().optional(),
  sdrResponsavel: z.string().trim().optional(),
  temperatura: z.enum(TEMPERATURAS_LEAD).optional(),
  ticketEstimado: z.number().positive().optional(),
  // Sprint 42 (Fundação Comercial)
  canalOrigem: z.enum(CANAIS_ORIGEM_LEAD).optional(),
  campanha: z.string().trim().optional(),
  interesse: z.string().trim().optional(),
});

export type CriarLeadInput = z.infer<typeof criarLeadSchema>;

/**
 * Use Case: criar um Lead — primeiro contato do fluxo comercial
 * (ARCHITECTURE.md, seção 20).
 *
 * Sprint 42: passou a publicar `lead.criado` no event_log (o gap de
 * "nenhum evento de Lead existe" — sinalizado desde a Sprint 4 — começa
 * a fechar aqui, seguindo o mesmo padrão de publicação já usado em
 * `converterLeadEmCliente`; a lista fechada de 21 eventos em
 * DATABASE.md continua desatualizada, mas isso é documentação, não
 * mecanismo em código — nenhuma validação em runtime depende dela).
 * `eventPublisher` opcional, mesmo padrão de `agendarComercial`.
 */
export async function criarLead(
  inputBruto: unknown,
  deps: { leadRepository: LeadRepository; eventPublisher?: IEventPublisher }
) {
  const input = criarLeadSchema.parse(inputBruto);

  const leadCriado = await deps.leadRepository.criar({
    nome: input.nome,
    origemLead: input.origemLead ?? null,
    sdrResponsavel: input.sdrResponsavel ?? null,
    temperatura: input.temperatura ?? null,
    ticketEstimado: input.ticketEstimado ?? null,
    statusComercial: "novo",
    metadata: null,
    canalOrigem: input.canalOrigem ?? null,
    campanha: input.campanha ?? null,
    interesse: input.interesse ?? null,
    ultimoContatoEm: null,
    proximoContatoEm: null,
    motivoPerda: null,
  });

  await deps.eventPublisher?.publicar({
    aggregate: "lead",
    aggregateId: leadCriado.id,
    eventName: "lead.criado",
    payload: { canalOrigem: leadCriado.canalOrigem, origemLead: leadCriado.origemLead },
    actorTipo: "humano",
    source: "pipeline_comercial.criar_lead",
  });

  return leadCriado;
}
