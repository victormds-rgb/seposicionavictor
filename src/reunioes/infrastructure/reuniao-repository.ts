import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@infra/persistence/db/client";
import { reuniao } from "@infra/persistence/db/schema";
import type { ReuniaoRepository, FiltrosReuniao } from "@/reunioes/domain/reuniao-repository";
import type { Reuniao, StatusReuniao } from "@/reunioes/domain/reuniao";

type ReuniaoRow = typeof reuniao.$inferSelect;

function paraDominio(row: ReuniaoRow): Reuniao {
  return {
    id: row.id,
    dataHora: row.dataHora,
    participantes: (row.participantes as string[] | null) ?? null,
    clienteId: row.clienteId,
    projetoId: row.projetoId,
    local: row.local,
    notasBrutas: row.notasBrutas,
    status: row.status as StatusReuniao,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}

export class DrizzleReuniaoRepository implements ReuniaoRepository {
  async criar(input: Omit<Reuniao, "id">): Promise<Reuniao> {
    const [row] = await db
      .insert(reuniao)
      .values({
        dataHora: input.dataHora,
        participantes: input.participantes,
        clienteId: input.clienteId,
        projetoId: input.projetoId,
        local: input.local,
        notasBrutas: input.notasBrutas,
        status: input.status,
        metadata: input.metadata,
      })
      .returning();

    if (!row) throw new Error("Falha ao criar Reuniao: nenhuma linha retornada.");
    return paraDominio(row);
  }

  async buscarPorId(id: string): Promise<Reuniao | null> {
    const [row] = await db.select().from(reuniao).where(eq(reuniao.id, id)).limit(1);
    return row ? paraDominio(row) : null;
  }

  async atualizarStatus(id: string, status: StatusReuniao): Promise<void> {
    await db.update(reuniao).set({ status, updatedAt: new Date() }).where(eq(reuniao.id, id));
  }

  async atualizarNotasBrutas(id: string, notasBrutas: string): Promise<void> {
    await db
      .update(reuniao)
      .set({ notasBrutas, updatedAt: new Date() })
      .where(eq(reuniao.id, id));
  }

  async listar(filtros: FiltrosReuniao): Promise<Reuniao[]> {
    const condicoes = [];
    if (filtros.status) condicoes.push(eq(reuniao.status, filtros.status));
    if (filtros.de) condicoes.push(gte(reuniao.dataHora, filtros.de));
    if (filtros.ate) condicoes.push(lte(reuniao.dataHora, filtros.ate));

    const rows = await db
      .select()
      .from(reuniao)
      .where(condicoes.length > 0 ? and(...condicoes) : undefined);

    return rows.map(paraDominio);
  }
}
