import type { ItemDeAgendaRepository } from "@/agenda/domain/item-agenda-repository";
import { podeSerMarcadoComoPerdido } from "@/agenda/domain/item-agenda";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";
import type { UnitOfWork } from "@/shared/domain/unit-of-work";

/**
 * Marca como `perdido` qualquer ItemDeAgenda que ainda está `agendado`
 * mas cuja data/hora já passou. Este é o mecanismo de "notificação
 * básica de ausência" previsto para a Sprint 3 (IMPLEMENTATION_PLAN.md)
 * — usa o evento `item_agenda.perdido`, já catalogado no domínio,
 * em vez de introduzir um novo tipo de Alerta (Bounded Context
 * Notificações, ainda não implementado — Sprint 9).
 *
 * Nota de execução: extraído para Job do Scheduler
 * (`infra/scheduler/jobs/atualizar-itens-vencidos-job.ts`) na etapa de
 * Hardening — não roda mais durante o carregamento da página /agenda.
 */
export async function atualizarItensVencidos(
  agora: Date,
  deps: {
    itemDeAgendaRepository: ItemDeAgendaRepository;
    eventPublisher?: IEventPublisher;
    unitOfWork?: UnitOfWork;
  }
) {
  const vencidos = await deps.itemDeAgendaRepository.listarAgendadosVencidos(agora);
  const atualizados = [];

  for (const item of vencidos) {
    if (!podeSerMarcadoComoPerdido(item, agora)) continue;

    const marcarEPublicar = async () => {
      // Atualização otimista (WHERE status = 'agendado'): se outra
      // execução concorrente já marcou este item como perdido entre o
      // SELECT acima e este UPDATE, linhasAfetadas será 0 e o evento
      // não é publicado de novo.
      const linhasAfetadas = await deps.itemDeAgendaRepository.marcarComoPerdidoSeAgendado(item.id);
      if (linhasAfetadas !== 1) return false;

      await deps.eventPublisher?.publicar({
        aggregate: "item_agenda",
        aggregateId: item.id,
        eventName: "item_agenda.perdido",
        payload: { tipo: item.tipo, dataHora: item.dataHora },
        actorTipo: "sistema",
        source: "agenda.atualizar_itens_vencidos",
      });
      return true;
    };

    // Com UnitOfWork disponível, o UPDATE do item e a gravação do
    // evento no event_log rodam na mesma transação Postgres. Sem
    // UnitOfWork, comportamento idêntico ao anterior a esta etapa de
    // Hardening.
    const marcado = deps.unitOfWork
      ? await deps.unitOfWork.run(marcarEPublicar)
      : await marcarEPublicar();

    if (marcado) atualizados.push(item.id);
  }

  return atualizados;
}
