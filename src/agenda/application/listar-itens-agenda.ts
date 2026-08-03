import type {
  ItemDeAgendaRepository,
  FiltrosItemAgenda,
} from "@/agenda/domain/item-agenda-repository";

export async function listarItensAgenda(
  filtros: FiltrosItemAgenda,
  deps: { itemDeAgendaRepository: ItemDeAgendaRepository }
) {
  return deps.itemDeAgendaRepository.listar(filtros);
}
