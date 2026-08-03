import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@infra/persistence/db/client";
import { alerta } from "@infra/persistence/db/schema";
import type { AlertaRepository, FiltrosAlerta } from "@/notificacoes/domain/notificacoes-repository";
import type { Alerta, TipoAlerta, StatusAlerta } from "@/notificacoes/domain/alerta";

type AlertaRow = typeof alerta.$inferSelect;

function paraDominio(row: AlertaRow): Alerta {
  return {
    id: row.id,
    tipo: row.tipo as TipoAlerta,
    condicaoGatilho: row.condicaoGatilho,
    entidadeRelacionadaTipo: row.entidadeRelacionadaTipo,
    entidadeRelacionadaId: row.entidadeRelacionadaId,
    status: row.status as StatusAlerta,
    dataDisparo: row.dataDisparo,
    dataResolucao: row.dataResolucao,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}

export class DrizzleAlertaRepository implements AlertaRepository {
  async criar(input: Omit<Alerta, "id">): Promise<Alerta> {
    const [row] = await getDb()
      .insert(alerta)
      .values({
        tipo: input.tipo,
        condicaoGatilho: input.condicaoGatilho,
        entidadeRelacionadaTipo: input.entidadeRelacionadaTipo,
        entidadeRelacionadaId: input.entidadeRelacionadaId,
        status: input.status,
        dataDisparo: input.dataDisparo,
        dataResolucao: input.dataResolucao,
        metadata: input.metadata,
      })
      .returning();

    if (!row) throw new Error("Falha ao criar Alerta: nenhuma linha retornada.");
    return paraDominio(row);
  }

  async buscarPorId(id: string): Promise<Alerta | null> {
    const [row] = await getDb().select().from(alerta).where(eq(alerta.id, id)).limit(1);
    return row ? paraDominio(row) : null;
  }

  async garantirAtivo(input: Omit<Alerta, "id">): Promise<{ alerta: Alerta; criado: boolean }> {
    const [row] = await getDb()
      .insert(alerta)
      .values({
        tipo: input.tipo,
        condicaoGatilho: input.condicaoGatilho,
        entidadeRelacionadaTipo: input.entidadeRelacionadaTipo,
        entidadeRelacionadaId: input.entidadeRelacionadaId,
        status: input.status,
        dataDisparo: input.dataDisparo,
        dataResolucao: input.dataResolucao,
        metadata: input.metadata,
      })
      .onConflictDoNothing({
        target: [alerta.tipo, alerta.entidadeRelacionadaId],
        where: sql`${alerta.status} = 'ativo'`,
      })
      .returning();

    if (row) return { alerta: paraDominio(row), criado: true };

    const existente = await this.buscarAtivoPorTipoEEntidade(input.tipo, input.entidadeRelacionadaId);
    if (!existente) {
      throw new Error(
        "Falha ao garantir Alerta ativo: conflito de índice detectado, mas nenhum alerta ativo encontrado ao reconsultar."
      );
    }
    return { alerta: existente, criado: false };
  }

  async buscarAtivoPorTipoEEntidade(
    tipo: TipoAlerta,
    entidadeRelacionadaId: string | null
  ): Promise<Alerta | null> {
    const condicoes = [eq(alerta.tipo, tipo), eq(alerta.status, "ativo")];
    condicoes.push(
      entidadeRelacionadaId
        ? eq(alerta.entidadeRelacionadaId, entidadeRelacionadaId)
        : isNull(alerta.entidadeRelacionadaId)
    );

    const [row] = await getDb()
      .select()
      .from(alerta)
      .where(and(...condicoes))
      .limit(1);
    return row ? paraDominio(row) : null;
  }

  async atualizarStatus(id: string, status: StatusAlerta, dataResolucao?: Date): Promise<void> {
    await getDb()
      .update(alerta)
      .set({ status, dataResolucao, updatedAt: new Date() })
      .where(eq(alerta.id, id));
  }

  async listar(filtros: FiltrosAlerta): Promise<Alerta[]> {
    const condicoes = [];
    if (filtros.status) condicoes.push(eq(alerta.status, filtros.status));
    if (filtros.tipo) condicoes.push(eq(alerta.tipo, filtros.tipo));

    const rows = await getDb()
      .select()
      .from(alerta)
      .where(condicoes.length > 0 ? and(...condicoes) : undefined);

    return rows.map(paraDominio);
  }
}
