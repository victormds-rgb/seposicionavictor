import { z } from "zod";
import type { LeadRepository } from "@/pipeline_comercial/domain/lead-repository";
import { podeSerAgendado } from "@/pipeline_comercial/domain/lead";
import type { ReuniaoRepository } from "@/reunioes/domain/reuniao-repository";
import type { ItemDeAgendaRepository } from "@/agenda/domain/item-agenda-repository";
import { agendarReuniao } from "@/reunioes/application/agendar-reuniao";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class LeadNaoEncontradoError extends Error {}
export class TransicaoInvalidaError extends Error {}

const agendarComercialSchema = z.object({
  leadId: z.string().uuid(),
  dataHora: z.coerce.date(),
  googleCalendarEventId: z.string().optional(),
});

export type AgendarComercialInput = z.infer<typeof agendarComercialSchema>;

export interface AgendarComercialDeps {
  leadRepository: LeadRepository;
  reuniaoRepository: ReuniaoRepository;
  itemDeAgendaRepository: ItemDeAgendaRepository;
  eventPublisher?: IEventPublisher;
}

/**
 * Use Case: agendar a reunião comercial de um Lead.
 *
 * Reaproveita o Use Case `agendarReuniao` do Bounded Context Reuniões
 * (já implementado e aprovado na Sprint 3) em vez de duplicar a
 * lógica de criação de Reuniao/ItemDeAgenda — Pipeline Comercial
 * "produz" a Reuniao, mas não a possui (ARCHITECTURE.md, seção 20).
 *
 * Integração real com Google Calendar não é exercitada nesta Sprint
 * (sandbox sem acesso à API do Google) — `googleCalendarEventId` fica
 * `null` quando não fornecido, sem bloquear o fluxo.
 */
export async function agendarComercial(inputBruto: unknown, deps: AgendarComercialDeps) {
  const input = agendarComercialSchema.parse(inputBruto);

  const lead = await deps.leadRepository.buscarPorId(input.leadId);
  if (!lead) throw new LeadNaoEncontradoError(`Lead ${input.leadId} não encontrado.`);
  if (!podeSerAgendado(lead)) {
    throw new TransicaoInvalidaError(
      `Lead ${input.leadId} não pode ser agendado no status atual (${lead.statusComercial}).`
    );
  }

  const reuniao = await agendarReuniao(
    { dataHora: input.dataHora },
    {
      reuniaoRepository: deps.reuniaoRepository,
      itemDeAgendaRepository: deps.itemDeAgendaRepository,
      eventPublisher: deps.eventPublisher,
    }
  );

  const agendamento = await deps.leadRepository.criarAgendamento({
    leadId: input.leadId,
    googleCalendarEventId: input.googleCalendarEventId ?? null,
    dataHora: input.dataHora,
    status: "agendado",
    reuniaoId: reuniao.id,
  });

  await deps.leadRepository.atualizarStatusComercial(input.leadId, "agendado");

  return { agendamento, reuniao };
}
