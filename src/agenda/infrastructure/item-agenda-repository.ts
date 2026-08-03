import { and, eq, gte, lte, lt } from "drizzle-orm";
import { getDb } from "@infra/persistence/db/client";
import { itemAgenda } from "@infra/persistence/db/schema";
import type {
  ItemDeAgendaRepository,
  FiltrosItemAgenda,
} from "@/agenda/domain/item-agenda-repository";
import type { ItemDeAgenda, StatusItemAgenda } from "@/agenda/domain/item-agenda";

type ItemAgendaRow = typeof itemAgenda.$inferSelect;

function paraDominio(row: ItemAgendaRow): ItemDeAgenda {
  return {
    id: row.id,
    tipo: row.tipo as ItemDeAgenda["tipo"],
    dataHora: row.dataHora,
    reuniaoId: row.reuniaoId,
    tarefaId: row.tarefaId,
    rotinaFixaReferencia: row.rotinaFixaReferencia,
    recorrente: row.recorrente,
    status: row.status as StatusItemAgenda,
  };
}

export class DrizzleItemDeAgendaRepository implements ItemDeAgendaRepository {
  async criar(input: Omit<ItemDeAgenda, "id">): Promise<ItemDeAgenda> {
    const [row] = await getDb()
      .insert(itemAgenda)
      .values({
        tipo: input.tipo,
        dataHora: input.dataHora,
        reuniaoId: input.reuniaoId,
        tarefaId: input.tarefaId,
        rotinaFixaReferencia: input.rotinaFixaReferencia,
        recorrente: input.recorrente,
        status: input.status,
      })
      .returning();

    if (!row) throw new Error("Falha ao criar ItemDeAgenda: nenhuma linha retornada.");
    return paraDominio(row);
  }

  async buscarPorId(id: string): Promise<ItemDeAgenda | null> {
    const [row] = await getDb().select().from(itemAgenda).where(eq(itemAgenda.id, id)).limit(1);
    return row ? paraDominio(row) : null;
  }

  async atualizarStatus(id: string, status: StatusItemAgenda): Promise<void> {
    await getDb()
      .update(itemAgenda)
      .set({ status, updatedAt: new Date() })
      .where(eq(itemAgenda.id, id));
  }

  async listar(filtros: FiltrosItemAgenda): Promise<ItemDeAgenda[]> {
    const condicoes = [];
    if (filtros.status) condicoes.push(eq(itemAgenda.status, filtros.status));
    if (filtros.de) condicoes.push(gte(itemAgenda.dataHora, filtros.de));
    if (filtros.ate) condicoes.push(lte(itemAgenda.dataHora, filtros.ate));

    const rows = await getDb()
      .select()
      .from(itemAgenda)
      .where(condicoes.length > 0 ? and(...condicoes) : undefined);

    return rows.map(paraDominio);
  }

  async existeRotinaFixaNaSemana(referencia: string, de: Date, ate: Date): Promise<boolean> {
    const rows = await getDb()
      .select()
      .from(itemAgenda)
      .where(
        and(
          eq(itemAgenda.rotinaFixaReferencia, referencia),
          gte(itemAgenda.dataHora, de),
          lte(itemAgenda.dataHora, ate)
        )
      )
      .limit(1);
    return rows.length > 0;
  }

  async listarAgendadosVencidos(agora: Date): Promise<ItemDeAgenda[]> {
    const rows = await getDb()
      .select()
      .from(itemAgenda)
      .where(and(eq(itemAgenda.status, "agendado"), lt(itemAgenda.dataHora, agora)));
    return rows.map(paraDominio);
  }

  async marcarComoPerdidoSeAgendado(id: string): Promise<number> {
    const rows = await getDb()
      .update(itemAgenda)
      .set({ status: "perdido", updatedAt: new Date() })
      .where(and(eq(itemAgenda.id, id), eq(itemAgenda.status, "agendado")))
      .returning({ id: itemAgenda.id });
    return rows.length;
  }
}
