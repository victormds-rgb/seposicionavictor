import { and, count, desc, eq, gte } from "drizzle-orm";
import { db } from "@infra/persistence/db/client";
import { pecaConteudo } from "@infra/persistence/db/schema";
import type {
  PecaDeConteudoRepository,
  FiltrosPecaDeConteudo,
} from "@/conteudo/domain/peca-de-conteudo-repository";
import type { PecaDeConteudo, StatusConteudo } from "@/conteudo/domain/peca-de-conteudo";

type PecaRow = typeof pecaConteudo.$inferSelect;

function paraDominio(row: PecaRow): PecaDeConteudo {
  return {
    id: row.id,
    temaId: row.temaId,
    frameworkId: row.frameworkId,
    canal: row.canal as PecaDeConteudo["canal"],
    serieFixaId: row.serieFixaId,
    pilarId: row.pilarId,
    status: row.status as StatusConteudo,
    origemTipo: row.origemTipo as PecaDeConteudo["origemTipo"],
    origemCaseId: row.origemCaseId,
    origemBuildLogId: row.origemBuildLogId,
    pecaOrigemId: row.pecaOrigemId,
    conteudoTexto: row.conteudoTexto,
    dataPublicacao: row.dataPublicacao,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}

export class DrizzlePecaDeConteudoRepository implements PecaDeConteudoRepository {
  async criar(input: Omit<PecaDeConteudo, "id">): Promise<PecaDeConteudo> {
    const [row] = await db
      .insert(pecaConteudo)
      .values({
        temaId: input.temaId,
        frameworkId: input.frameworkId,
        canal: input.canal,
        serieFixaId: input.serieFixaId,
        pilarId: input.pilarId,
        status: input.status,
        origemTipo: input.origemTipo,
        origemCaseId: input.origemCaseId,
        origemBuildLogId: input.origemBuildLogId,
        pecaOrigemId: input.pecaOrigemId,
        conteudoTexto: input.conteudoTexto,
        dataPublicacao: input.dataPublicacao,
        metadata: input.metadata,
      })
      .returning();

    if (!row) throw new Error("Falha ao criar PecaDeConteudo: nenhuma linha retornada.");
    return paraDominio(row);
  }

  async buscarPorId(id: string): Promise<PecaDeConteudo | null> {
    const [row] = await db.select().from(pecaConteudo).where(eq(pecaConteudo.id, id)).limit(1);
    return row ? paraDominio(row) : null;
  }

  async atualizarStatus(id: string, status: StatusConteudo, dataPublicacao?: Date): Promise<void> {
    const valores: Record<string, unknown> = { status, updatedAt: new Date() };
    if (dataPublicacao) valores.dataPublicacao = dataPublicacao;
    await db.update(pecaConteudo).set(valores).where(eq(pecaConteudo.id, id));
  }

  async listar(filtros: FiltrosPecaDeConteudo): Promise<PecaDeConteudo[]> {
    const condicoes = [];
    if (filtros.status) condicoes.push(eq(pecaConteudo.status, filtros.status));
    if (filtros.pilarId) condicoes.push(eq(pecaConteudo.pilarId, filtros.pilarId));
    if (filtros.publicadasDesde) {
      condicoes.push(gte(pecaConteudo.dataPublicacao, filtros.publicadasDesde));
    }

    const rows = await db
      .select()
      .from(pecaConteudo)
      .where(condicoes.length > 0 ? and(...condicoes) : undefined);

    return rows.map(paraDominio);
  }

  async contarPublicadasPorPilar(
    publicadasDesde?: Date
  ): Promise<Array<{ pilarId: string; total: number }>> {
    const condicoes = [eq(pecaConteudo.status, "publicado")];
    if (publicadasDesde) condicoes.push(gte(pecaConteudo.dataPublicacao, publicadasDesde));

    const rows = await db
      .select({ pilarId: pecaConteudo.pilarId, total: count() })
      .from(pecaConteudo)
      .where(and(...condicoes))
      .groupBy(pecaConteudo.pilarId);

    return rows.map((r) => ({ pilarId: r.pilarId, total: Number(r.total) }));
  }

  async listarUltimasPublicadas(limite: number): Promise<PecaDeConteudo[]> {
    const rows = await db
      .select()
      .from(pecaConteudo)
      .where(eq(pecaConteudo.status, "publicado"))
      .orderBy(desc(pecaConteudo.dataPublicacao))
      .limit(limite);

    return rows.map(paraDominio);
  }
}
