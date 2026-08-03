import type { ItemDeAgendaRepository } from "@/agenda/domain/item-agenda-repository";
import { podeSerConcluido } from "@/agenda/domain/item-agenda";

export class ItemDeAgendaNaoEncontradoError extends Error {}
export class TransicaoInvalidaError extends Error {}

export async function marcarItemComoConcluido(
  itemId: string,
  deps: { itemDeAgendaRepository: ItemDeAgendaRepository }
) {
  const item = await deps.itemDeAgendaRepository.buscarPorId(itemId);
  if (!item) {
    throw new ItemDeAgendaNaoEncontradoError(`ItemDeAgenda ${itemId} não encontrado.`);
  }
  if (!podeSerConcluido(item)) {
    throw new TransicaoInvalidaError(
      `ItemDeAgenda ${itemId} não pode ser concluído no status atual (${item.status}).`
    );
  }

  await deps.itemDeAgendaRepository.atualizarStatus(itemId, "concluido");
}
