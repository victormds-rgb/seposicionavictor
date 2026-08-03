import type { ItemDeAgenda, StatusItemAgenda } from "./item-agenda";

export interface FiltrosItemAgenda {
  de?: Date;
  ate?: Date;
  status?: StatusItemAgenda;
}

export interface ItemDeAgendaRepository {
  criar(item: Omit<ItemDeAgenda, "id">): Promise<ItemDeAgenda>;
  buscarPorId(id: string): Promise<ItemDeAgenda | null>;
  atualizarStatus(id: string, status: StatusItemAgenda): Promise<void>;
  listar(filtros: FiltrosItemAgenda): Promise<ItemDeAgenda[]>;
  existeRotinaFixaNaSemana(referencia: string, de: Date, ate: Date): Promise<boolean>;
  listarAgendadosVencidos(agora: Date): Promise<ItemDeAgenda[]>;
  /**
   * Atualização otimista: só marca como `perdido` se o status ainda
   * for `agendado` no momento do UPDATE (fecha a janela entre SELECT
   * e UPDATE quando duas execuções concorrentes leem o mesmo item
   * vencido). Retorna quantas linhas foram afetadas — 0 ou 1.
   */
  marcarComoPerdidoSeAgendado(id: string): Promise<number>;
}
