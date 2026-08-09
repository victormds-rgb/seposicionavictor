import { DrizzleLeadRepository } from "@/pipeline_comercial/infrastructure/lead-repository";
import { DrizzleReuniaoRepository } from "@/reunioes/infrastructure/reuniao-repository";
import { DrizzleItemDeAgendaRepository } from "@/agenda/infrastructure/item-agenda-repository";
import { criarEventDispatcher } from "@/event_log/infrastructure/composicao";
import { SystemClock } from "@/shared/infrastructure/system-clock";

export function criarDependenciasDoPipelineComercial() {
  return {
    leadRepository: new DrizzleLeadRepository(),
    reuniaoRepository: new DrizzleReuniaoRepository(),
    itemDeAgendaRepository: new DrizzleItemDeAgendaRepository(),
    eventPublisher: criarEventDispatcher(),
    clock: new SystemClock(),
  };
}
