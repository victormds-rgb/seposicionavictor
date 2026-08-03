import { desc, eq } from "drizzle-orm";
import { db } from "@infra/persistence/db/client";
import { auditoriaDrift } from "@infra/persistence/db/schema";
import type { AuditoriaDeDriftRepository } from "@/notificacoes/domain/notificacoes-repository";
import type { AuditoriaDeDrift, StatusAuditoria } from "@/notificacoes/domain/auditoria-de-drift";

type AuditoriaRow = typeof auditoriaDrift.$inferSelect;

function paraDominio(row: AuditoriaRow): AuditoriaDeDrift {
  return {
    id: row.id,
    dataExecucao: row.dataExecucao,
    pecasAvaliadas: row.pecasAvaliadas as string[],
    percentualFalha: row.percentualFalha ? Number(row.percentualFalha) : null,
    recomendacaoGerada: row.recomendacaoGerada,
    status: row.status as StatusAuditoria,
  };
}

export class DrizzleAuditoriaDeDriftRepository implements AuditoriaDeDriftRepository {
  async criar(input: Omit<AuditoriaDeDrift, "id">): Promise<AuditoriaDeDrift> {
    const [row] = await db
      .insert(auditoriaDrift)
      .values({
        dataExecucao: input.dataExecucao,
        pecasAvaliadas: input.pecasAvaliadas,
        percentualFalha: input.percentualFalha?.toString(),
        recomendacaoGerada: input.recomendacaoGerada,
        status: input.status,
      })
      .returning();

    if (!row) throw new Error("Falha ao criar AuditoriaDeDrift: nenhuma linha retornada.");
    return paraDominio(row);
  }

  async buscarPorId(id: string): Promise<AuditoriaDeDrift | null> {
    const [row] = await db.select().from(auditoriaDrift).where(eq(auditoriaDrift.id, id)).limit(1);
    return row ? paraDominio(row) : null;
  }

  async atualizar(
    id: string,
    dados: Partial<
      Pick<AuditoriaDeDrift, "percentualFalha" | "recomendacaoGerada" | "status" | "pecasAvaliadas">
    >
  ): Promise<void> {
    const valores: Record<string, unknown> = { updatedAt: new Date() };
    if (dados.pecasAvaliadas !== undefined) valores.pecasAvaliadas = dados.pecasAvaliadas;
    if (dados.percentualFalha !== undefined) valores.percentualFalha = dados.percentualFalha?.toString();
    if (dados.recomendacaoGerada !== undefined) valores.recomendacaoGerada = dados.recomendacaoGerada;
    if (dados.status !== undefined) valores.status = dados.status;

    await db.update(auditoriaDrift).set(valores).where(eq(auditoriaDrift.id, id));
  }

  async buscarMaisRecente(): Promise<AuditoriaDeDrift | null> {
    const [row] = await db
      .select()
      .from(auditoriaDrift)
      .orderBy(desc(auditoriaDrift.dataExecucao))
      .limit(1);
    return row ? paraDominio(row) : null;
  }

  async listar(filtros: { status?: StatusAuditoria }): Promise<AuditoriaDeDrift[]> {
    const rows = filtros.status
      ? await db.select().from(auditoriaDrift).where(eq(auditoriaDrift.status, filtros.status))
      : await db.select().from(auditoriaDrift);
    return rows.map(paraDominio);
  }
}
