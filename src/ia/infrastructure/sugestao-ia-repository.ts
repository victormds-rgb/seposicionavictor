import { and, desc, eq } from "drizzle-orm";
import { db } from "@infra/persistence/db/client";
import { sugestaoIa } from "@infra/persistence/db/schema";
import type { SugestaoIARepository } from "@/ia/domain/sugestao-ia-repository";
import type { SugestaoIA, StatusSugestao } from "@/ia/domain/sugestao-ia";

type SugestaoIARow = typeof sugestaoIa.$inferSelect;

function paraDominio(row: SugestaoIARow): SugestaoIA {
  return {
    id: row.id,
    tipoSugestao: row.tipoSugestao as SugestaoIA["tipoSugestao"],
    entidadeOrigemTipo: row.entidadeOrigemTipo,
    entidadeOrigemId: row.entidadeOrigemId,
    entidadeAlvoTipo: row.entidadeAlvoTipo,
    entidadeAlvoId: row.entidadeAlvoId,
    conteudoSugerido: row.conteudoSugerido as Record<string, unknown>,
    provider: row.provider,
    modelo: row.modelo,
    promptVersion: row.promptVersion,
    temperatura: row.temperatura ? Number(row.temperatura) : null,
    tokensInput: row.tokensInput,
    tokensOutput: row.tokensOutput,
    custoEstimado: row.custoEstimado ? Number(row.custoEstimado) : null,
    tempoRespostaMs: row.tempoRespostaMs,
    confianca: row.confianca ? Number(row.confianca) : null,
    origemDaSugestao: row.origemDaSugestao as SugestaoIA["origemDaSugestao"],
    status: row.status as StatusSugestao,
  };
}

export class DrizzleSugestaoIARepository implements SugestaoIARepository {
  async criar(sugestao: Omit<SugestaoIA, "id">): Promise<SugestaoIA> {
    const [row] = await db
      .insert(sugestaoIa)
      .values({
        tipoSugestao: sugestao.tipoSugestao,
        entidadeOrigemTipo: sugestao.entidadeOrigemTipo,
        entidadeOrigemId: sugestao.entidadeOrigemId,
        entidadeAlvoTipo: sugestao.entidadeAlvoTipo,
        entidadeAlvoId: sugestao.entidadeAlvoId,
        conteudoSugerido: sugestao.conteudoSugerido,
        provider: sugestao.provider,
        modelo: sugestao.modelo,
        promptVersion: sugestao.promptVersion,
        temperatura: sugestao.temperatura?.toString(),
        tokensInput: sugestao.tokensInput,
        tokensOutput: sugestao.tokensOutput,
        custoEstimado: sugestao.custoEstimado?.toString(),
        tempoRespostaMs: sugestao.tempoRespostaMs,
        confianca: sugestao.confianca?.toString(),
        origemDaSugestao: sugestao.origemDaSugestao,
        status: sugestao.status,
      })
      .returning();

    if (!row) {
      throw new Error("Falha ao criar SugestaoIA: nenhuma linha retornada.");
    }
    return paraDominio(row);
  }

  async buscarPorId(id: string): Promise<SugestaoIA | null> {
    const [row] = await db.select().from(sugestaoIa).where(eq(sugestaoIa.id, id)).limit(1);
    return row ? paraDominio(row) : null;
  }

  async atualizarStatus(
    id: string,
    status: StatusSugestao,
    conteudoSugeridoFinal?: Record<string, unknown>
  ): Promise<void> {
    await db
      .update(sugestaoIa)
      .set({
        status,
        ...(conteudoSugeridoFinal ? { conteudoSugerido: conteudoSugeridoFinal } : {}),
        updatedAt: new Date(),
      })
      .where(eq(sugestaoIa.id, id));
  }

  async buscarPendentePorRegistroOrigem(entidadeOrigemId: string): Promise<SugestaoIA | null> {
    const [row] = await db
      .select()
      .from(sugestaoIa)
      .where(
        and(eq(sugestaoIa.entidadeOrigemId, entidadeOrigemId), eq(sugestaoIa.status, "pendente"))
      )
      .orderBy(desc(sugestaoIa.createdAt))
      .limit(1);
    return row ? paraDominio(row) : null;
  }

  async buscarMaisRecentePorRegistroOrigem(entidadeOrigemId: string): Promise<SugestaoIA | null> {
    const [row] = await db
      .select()
      .from(sugestaoIa)
      .where(eq(sugestaoIa.entidadeOrigemId, entidadeOrigemId))
      .orderBy(desc(sugestaoIa.createdAt))
      .limit(1);
    return row ? paraDominio(row) : null;
  }
}
