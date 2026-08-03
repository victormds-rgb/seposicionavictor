import { DrizzleReuniaoRepository } from "@/reunioes/infrastructure/reuniao-repository";
import { DrizzleItemDeAgendaRepository } from "@/agenda/infrastructure/item-agenda-repository";
import { DrizzleRegistroBrutoRepository } from "@/inbox/infrastructure/registro-bruto-repository";
import { criarEventDispatcher } from "@/event_log/infrastructure/composicao";
import { DrizzleUnitOfWork } from "@infra/persistence/db/unit-of-work";

/**
 * Raiz de composição dos Bounded Contexts Reuniões e Agenda
 * (CODING_GUIDELINES.md, seção 2). Inclui o repositório de
 * RegistroBruto porque `marcarReuniaoComoProcessada` precisa
 * consultá-lo (leitura entre contextos via repositório já existente).
 */
export function criarDependenciasDaAgenda() {
  return {
    reuniaoRepository: new DrizzleReuniaoRepository(),
    itemDeAgendaRepository: new DrizzleItemDeAgendaRepository(),
    registroBrutoRepository: new DrizzleRegistroBrutoRepository(),
    eventPublisher: criarEventDispatcher(),
    unitOfWork: new DrizzleUnitOfWork(),
  };
}
