import type { ItemDeAgendaRepository } from "@/agenda/domain/item-agenda-repository";
import { ROTINA_SEMANAL_FIXA } from "@/agenda/domain/item-agenda";

/**
 * Instancia os 5 itens da rotina semanal fixa (SOM, Cap. 9.4) para a
 * semana que começa em `inicioDaSemana` (uma segunda-feira).
 *
 * Idempotente: não duplica um item de rotina fixa já criado para a
 * mesma referência na mesma semana (verificado via
 * `existeRotinaFixaNaSemana`).
 *
 * Nota: nenhum evento de domínio é emitido aqui — a lista fechada de
 * eventos (DOMAIN_MODEL.md) não inclui um evento de criação de
 * ItemDeAgenda (removido por redundância na Revisão Arquitetural).
 * Este Use Case é acionado por scheduler (ARCHITECTURE.md, seção 12),
 * não por reação a outro evento de domínio.
 */
export async function instanciarRotinaSemanal(
  inicioDaSemana: Date,
  deps: { itemDeAgendaRepository: ItemDeAgendaRepository }
) {
  const criados = [];

  for (const atividade of ROTINA_SEMANAL_FIXA) {
    const dataHora = new Date(inicioDaSemana);
    dataHora.setDate(dataHora.getDate() + (atividade.diaSemana - 1));

    const fimDoDia = new Date(dataHora);
    fimDoDia.setHours(23, 59, 59, 999);
    const inicioDoDia = new Date(dataHora);
    inicioDoDia.setHours(0, 0, 0, 0);

    const jaExiste = await deps.itemDeAgendaRepository.existeRotinaFixaNaSemana(
      atividade.referencia,
      inicioDoDia,
      fimDoDia
    );
    if (jaExiste) continue;

    const item = await deps.itemDeAgendaRepository.criar({
      tipo: "rotina_fixa",
      dataHora,
      reuniaoId: null,
      tarefaId: null,
      rotinaFixaReferencia: atividade.referencia,
      recorrente: true,
      status: "agendado",
    });
    criados.push(item);
  }

  return criados;
}
