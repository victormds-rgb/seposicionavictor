import { desc, eq } from "drizzle-orm";
import { db } from "@infra/persistence/db/client";
import { buildLog } from "@infra/persistence/db/schema";
import type { BuildLogRepository } from "@/build_logs/domain/build-log-repository";
import type { BuildLog, StatusBuildLog } from "@/build_logs/domain/build-log";

type BuildLogRow = typeof buildLog.$inferSelect;

function paraDominio(row: BuildLogRow): BuildLog {
  return {
    id: row.id,
    projetoId: row.projetoId,
    contexto: row.contexto,
    quebra: row.quebra,
    decisao: row.decisao,
    proximoPasso: row.proximoPasso,
    status: row.status as StatusBuildLog,
    dataPublicacao: row.dataPublicacao,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}

export class DrizzleBuildLogRepository implements BuildLogRepository {
  async criar(input: Omit<BuildLog, "id">): Promise<BuildLog> {
    const [row] = await db
      .insert(buildLog)
      .values({
        projetoId: input.projetoId,
        contexto: input.contexto,
        quebra: input.quebra,
        decisao: input.decisao,
        proximoPasso: input.proximoPasso,
        status: input.status,
        dataPublicacao: input.dataPublicacao,
        metadata: input.metadata,
      })
      .returning();

    if (!row) throw new Error("Falha ao criar BuildLog: nenhuma linha retornada.");
    return paraDominio(row);
  }

  async buscarPorId(id: string): Promise<BuildLog | null> {
    const [row] = await db.select().from(buildLog).where(eq(buildLog.id, id)).limit(1);
    return row ? paraDominio(row) : null;
  }

  async atualizarCampos(
    id: string,
    campos: Partial<Pick<BuildLog, "contexto" | "quebra" | "decisao" | "proximoPasso">>
  ): Promise<void> {
    const valores: Record<string, unknown> = { updatedAt: new Date() };
    if (campos.contexto !== undefined) valores.contexto = campos.contexto;
    if (campos.quebra !== undefined) valores.quebra = campos.quebra;
    if (campos.decisao !== undefined) valores.decisao = campos.decisao;
    if (campos.proximoPasso !== undefined) valores.proximoPasso = campos.proximoPasso;

    await db.update(buildLog).set(valores).where(eq(buildLog.id, id));
  }

  async publicar(id: string, dataPublicacao: Date): Promise<void> {
    await db
      .update(buildLog)
      .set({ status: "publicado", dataPublicacao, updatedAt: new Date() })
      .where(eq(buildLog.id, id));
  }

  async listarPorProjeto(projetoId: string): Promise<BuildLog[]> {
    const rows = await db.select().from(buildLog).where(eq(buildLog.projetoId, projetoId));
    return rows.map(paraDominio);
  }

  async buscarUltimoPublicado(projetoId: string): Promise<BuildLog | null> {
    const [row] = await db
      .select()
      .from(buildLog)
      .where(eq(buildLog.projetoId, projetoId))
      .orderBy(desc(buildLog.dataPublicacao))
      .limit(1);
    return row ? paraDominio(row) : null;
  }

  async listar(filtros: { status?: StatusBuildLog }): Promise<BuildLog[]> {
    const rows = filtros.status
      ? await db.select().from(buildLog).where(eq(buildLog.status, filtros.status))
      : await db.select().from(buildLog);
    return rows.map(paraDominio);
  }
}
