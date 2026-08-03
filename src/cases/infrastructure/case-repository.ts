import { asc, eq } from "drizzle-orm";
import { db } from "@infra/persistence/db/client";
import { caseTable, caseHistorico } from "@infra/persistence/db/schema";
import type { CaseRepository, CampoDeCaseEditavel } from "@/cases/domain/case-repository";
import type { Case, StatusCase } from "@/cases/domain/case";

type CaseRow = typeof caseTable.$inferSelect;

function paraDominio(row: CaseRow): Case {
  return {
    id: row.id,
    projetoId: row.projetoId,
    desculpa: row.desculpa,
    custo: row.custo ? Number(row.custo) : null,
    momentoQuebra: row.momentoQuebra,
    solucao: row.solucao,
    tempo: row.tempo,
    numeroResultado: row.numeroResultado,
    canalSugerido: row.canalSugerido as Case["canalSugerido"],
    canalEscolhido: row.canalEscolhido as Case["canalEscolhido"],
    status: row.status as StatusCase,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}

export class DrizzleCaseRepository implements CaseRepository {
  async criar(input: Omit<Case, "id">): Promise<Case> {
    const [row] = await db
      .insert(caseTable)
      .values({
        projetoId: input.projetoId,
        desculpa: input.desculpa,
        custo: input.custo?.toString(),
        momentoQuebra: input.momentoQuebra,
        solucao: input.solucao,
        tempo: input.tempo,
        numeroResultado: input.numeroResultado,
        canalSugerido: input.canalSugerido,
        canalEscolhido: input.canalEscolhido,
        status: input.status,
        metadata: input.metadata,
      })
      .returning();

    if (!row) throw new Error("Falha ao criar Case: nenhuma linha retornada.");
    return paraDominio(row);
  }

  async buscarPorId(id: string): Promise<Case | null> {
    const [row] = await db.select().from(caseTable).where(eq(caseTable.id, id)).limit(1);
    return row ? paraDominio(row) : null;
  }

  async buscarPorProjetoId(projetoId: string): Promise<Case[]> {
    const rows = await db.select().from(caseTable).where(eq(caseTable.projetoId, projetoId));
    return rows.map(paraDominio);
  }

  async atualizarCampos(id: string, campos: CampoDeCaseEditavel): Promise<Case> {
    const valores: Record<string, unknown> = { updatedAt: new Date() };
    if (campos.desculpa !== undefined) valores.desculpa = campos.desculpa;
    if (campos.custo !== undefined) valores.custo = campos.custo.toString();
    if (campos.momentoQuebra !== undefined) valores.momentoQuebra = campos.momentoQuebra;
    if (campos.solucao !== undefined) valores.solucao = campos.solucao;
    if (campos.tempo !== undefined) valores.tempo = campos.tempo;
    if (campos.numeroResultado !== undefined) valores.numeroResultado = campos.numeroResultado;
    if (campos.canalEscolhido !== undefined) valores.canalEscolhido = campos.canalEscolhido;

    const [row] = await db.update(caseTable).set(valores).where(eq(caseTable.id, id)).returning();
    if (!row) throw new Error(`Falha ao atualizar Case ${id}: nenhuma linha retornada.`);
    return paraDominio(row);
  }

  async atualizarStatus(id: string, status: StatusCase): Promise<void> {
    await db.update(caseTable).set({ status, updatedAt: new Date() }).where(eq(caseTable.id, id));
  }

  async listar(filtros: { status?: StatusCase }): Promise<Case[]> {
    const rows = filtros.status
      ? await db.select().from(caseTable).where(eq(caseTable.status, filtros.status))
      : await db.select().from(caseTable);
    return rows.map(paraDominio);
  }

  async registrarHistorico(caseId: string, snapshot: Record<string, unknown>): Promise<void> {
    await db.insert(caseHistorico).values({ caseId, snapshot });
  }

  async listarHistorico(
    caseId: string
  ): Promise<Array<{ snapshot: Record<string, unknown>; alteradoEm: Date }>> {
    const rows = await db
      .select()
      .from(caseHistorico)
      .where(eq(caseHistorico.caseId, caseId))
      .orderBy(asc(caseHistorico.alteradoEm));

    return rows.map((row) => ({
      snapshot: row.snapshot as Record<string, unknown>,
      alteradoEm: row.alteradoEm,
    }));
  }
}
