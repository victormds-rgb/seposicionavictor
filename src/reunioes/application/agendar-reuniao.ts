import { z } from "zod";
import type { ReuniaoRepository } from "@/reunioes/domain/reuniao-repository";
import type { ItemDeAgendaRepository } from "@/agenda/domain/item-agenda-repository";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

const agendarReuniaoSchema = z.object({
  dataHora: z.coerce.date(),
  participantes: z.array(z.string()).optional(),
  clienteId: z.string().uuid().optional(),
  projetoId: z.string().uuid().optional(),
  local: z.string().trim().optional(),
});

export type AgendarReuniaoInput = z.infer<typeof agendarReuniaoSchema>;

export interface AgendarReuniaoDeps {
  reuniaoRepository: ReuniaoRepository;
  itemDeAgendaRepository: ItemDeAgendaRepository;
  eventPublisher?: IEventPublisher;
}

/**
 * Use Case: agendar uma Reuniao e criar o ItemDeAgenda correspondente
 * (DOMAIN_MODEL.md: "reuniao.agendada" é consumido por ItemDeAgenda).
 */
export async function agendarReuniao(inputBruto: unknown, deps: AgendarReuniaoDeps) {
  const input = agendarReuniaoSchema.parse(inputBruto);

  const reuniao = await deps.reuniaoRepository.criar({
    dataHora: input.dataHora,
    participantes: input.participantes ?? null,
    clienteId: input.clienteId ?? null,
    projetoId: input.projetoId ?? null,
    local: input.local ?? null,
    notasBrutas: null,
    status: "agendada",
    metadata: null,
  });

  await deps.eventPublisher?.publicar({
    aggregate: "reuniao",
    aggregateId: reuniao.id,
    eventName: "reuniao.agendada",
    payload: { dataHora: reuniao.dataHora },
    actorTipo: "humano",
    source: "agenda.agendar_reuniao",
  });

  await deps.itemDeAgendaRepository.criar({
    tipo: "reuniao",
    dataHora: reuniao.dataHora,
    reuniaoId: reuniao.id,
    tarefaId: null,
    rotinaFixaReferencia: null,
    recorrente: false,
    status: "agendado",
  });

  return reuniao;
}
