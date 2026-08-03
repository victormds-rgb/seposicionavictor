import { eq, sql } from "drizzle-orm";
import { db } from "@infra/persistence/db/client";
import { ativoConhecimento, regraDecisao } from "@infra/persistence/db/schema";
import type {
  AtivoDeConhecimentoRepository,
  RegraDeDecisaoRepository,
} from "@/conhecimento/domain/conhecimento-repository";
import type {
  AtivoDeConhecimento,
  TipoAtivoConhecimento,
  StatusAtivoConhecimento,
} from "@/conhecimento/domain/ativo-de-conhecimento";
import type { RegraDeDecisao, AplicacaoRegraDecisao } from "@/conhecimento/domain/regra-de-decisao";

type AtivoRow = typeof ativoConhecimento.$inferSelect;
type RegraRow = typeof regraDecisao.$inferSelect;

function ativoParaDominio(row: AtivoRow): AtivoDeConhecimento {
  return {
    id: row.id,
    tipo: row.tipo as TipoAtivoConhecimento,
    conteudoTextual: row.conteudoTextual,
    origem: row.origem,
    frequenciaUso: row.frequenciaUso,
    status: row.status as StatusAtivoConhecimento,
  };
}

function regraParaDominio(row: RegraRow): RegraDeDecisao {
  return {
    id: row.id,
    nome: row.nome,
    estruturaArvore: row.estruturaArvore as Record<string, unknown>,
    aplicaA: row.aplicaA as AplicacaoRegraDecisao,
  };
}

export class DrizzleAtivoDeConhecimentoRepository implements AtivoDeConhecimentoRepository {
  async listar(filtros: { tipo?: TipoAtivoConhecimento }): Promise<AtivoDeConhecimento[]> {
    const rows = filtros.tipo
      ? await db.select().from(ativoConhecimento).where(eq(ativoConhecimento.tipo, filtros.tipo))
      : await db.select().from(ativoConhecimento);
    return rows.map(ativoParaDominio);
  }

  async criar(input: Omit<AtivoDeConhecimento, "id">): Promise<AtivoDeConhecimento> {
    const [row] = await db
      .insert(ativoConhecimento)
      .values({
        tipo: input.tipo,
        conteudoTextual: input.conteudoTextual,
        origem: input.origem,
        frequenciaUso: input.frequenciaUso,
        status: input.status,
      })
      .returning();

    if (!row) throw new Error("Falha ao criar AtivoDeConhecimento: nenhuma linha retornada.");
    return ativoParaDominio(row);
  }

  async incrementarFrequenciaUso(id: string): Promise<void> {
    await db
      .update(ativoConhecimento)
      .set({ frequenciaUso: sql`${ativoConhecimento.frequenciaUso} + 1`, updatedAt: new Date() })
      .where(eq(ativoConhecimento.id, id));
  }
}

export class DrizzleRegraDeDecisaoRepository implements RegraDeDecisaoRepository {
  async listar(): Promise<RegraDeDecisao[]> {
    const rows = await db.select().from(regraDecisao);
    return rows.map(regraParaDominio);
  }

  async buscarPorAplicacao(aplicaA: AplicacaoRegraDecisao): Promise<RegraDeDecisao | null> {
    const [row] = await db
      .select()
      .from(regraDecisao)
      .where(eq(regraDecisao.aplicaA, aplicaA))
      .limit(1);
    return row ? regraParaDominio(row) : null;
  }
}
