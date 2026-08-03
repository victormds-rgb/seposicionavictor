import { and, eq, ilike } from "drizzle-orm";
import { db } from "@infra/persistence/db/client";
import { documentoOficial, documentoChunkIndexado } from "@infra/persistence/db/schema";
import type {
  DocumentoOficialRepository,
  DocumentoChunkRepository,
  ChunkArmazenado,
} from "@/brand_intelligence/domain/brand-intelligence-repository";
import type {
  DocumentoOficial,
  StatusIndexacao,
  TipoDocumento,
} from "@/brand_intelligence/domain/documento-oficial";

type DocumentoRow = typeof documentoOficial.$inferSelect;

function paraDominio(row: DocumentoRow): DocumentoOficial {
  return {
    id: row.id,
    titulo: row.titulo,
    googleDriveFileId: row.googleDriveFileId,
    tipoDocumento: row.tipoDocumento as TipoDocumento,
    ultimaSincronizacao: row.ultimaSincronizacao,
    hashConteudo: row.hashConteudo,
    statusIndexacao: row.statusIndexacao as StatusIndexacao,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}

export class DrizzleDocumentoOficialRepository implements DocumentoOficialRepository {
  async criar(input: Omit<DocumentoOficial, "id">): Promise<DocumentoOficial> {
    const [row] = await db
      .insert(documentoOficial)
      .values({
        titulo: input.titulo,
        googleDriveFileId: input.googleDriveFileId,
        tipoDocumento: input.tipoDocumento,
        ultimaSincronizacao: input.ultimaSincronizacao,
        hashConteudo: input.hashConteudo,
        statusIndexacao: input.statusIndexacao,
        metadata: input.metadata,
      })
      .returning();

    if (!row) throw new Error("Falha ao criar DocumentoOficial: nenhuma linha retornada.");
    return paraDominio(row);
  }

  async buscarPorId(id: string): Promise<DocumentoOficial | null> {
    const [row] = await db.select().from(documentoOficial).where(eq(documentoOficial.id, id)).limit(1);
    return row ? paraDominio(row) : null;
  }

  async buscarPorGoogleDriveFileId(googleDriveFileId: string): Promise<DocumentoOficial | null> {
    const [row] = await db
      .select()
      .from(documentoOficial)
      .where(eq(documentoOficial.googleDriveFileId, googleDriveFileId))
      .limit(1);
    return row ? paraDominio(row) : null;
  }

  async atualizarStatus(id: string, status: StatusIndexacao): Promise<void> {
    await db
      .update(documentoOficial)
      .set({ statusIndexacao: status, updatedAt: new Date() })
      .where(eq(documentoOficial.id, id));
  }

  async atualizarAposSincronizacao(
    id: string,
    input: { hashConteudo: string; statusIndexacao: StatusIndexacao; ultimaSincronizacao: Date }
  ): Promise<void> {
    await db
      .update(documentoOficial)
      .set({
        hashConteudo: input.hashConteudo,
        statusIndexacao: input.statusIndexacao,
        ultimaSincronizacao: input.ultimaSincronizacao,
        updatedAt: new Date(),
      })
      .where(eq(documentoOficial.id, id));
  }

  async listar(filtros: { tipoDocumento?: TipoDocumento }): Promise<DocumentoOficial[]> {
    const rows = filtros.tipoDocumento
      ? await db
          .select()
          .from(documentoOficial)
          .where(eq(documentoOficial.tipoDocumento, filtros.tipoDocumento))
      : await db.select().from(documentoOficial);
    return rows.map(paraDominio);
  }
}

export class DrizzleDocumentoChunkRepository implements DocumentoChunkRepository {
  async substituirChunks(documentoId: string, chunks: string[]): Promise<ChunkArmazenado[]> {
    // Chunks são sempre recriáveis a partir da fonte oficial (ADR-004)
    // — substituição completa a cada sincronização, não merge.
    await db.delete(documentoChunkIndexado).where(eq(documentoChunkIndexado.documentoId, documentoId));

    if (chunks.length === 0) return [];

    const rows = await db
      .insert(documentoChunkIndexado)
      .values(
        chunks.map((conteudoChunk, ordem) => ({
          documentoId,
          conteudoChunk,
          ordem,
        }))
      )
      .returning();

    return rows.map((r) => ({
      id: r.id,
      documentoId: r.documentoId,
      conteudoChunk: r.conteudoChunk,
      ordem: r.ordem,
    }));
  }

  async listarPorDocumento(documentoId: string): Promise<ChunkArmazenado[]> {
    const rows = await db
      .select()
      .from(documentoChunkIndexado)
      .where(eq(documentoChunkIndexado.documentoId, documentoId))
      .orderBy(documentoChunkIndexado.ordem);

    return rows.map((r) => ({
      id: r.id,
      documentoId: r.documentoId,
      conteudoChunk: r.conteudoChunk,
      ordem: r.ordem,
    }));
  }

  async buscarPorTexto(consulta: string, limite: number): Promise<ChunkArmazenado[]> {
    const rows = await db
      .select()
      .from(documentoChunkIndexado)
      .where(and(ilike(documentoChunkIndexado.conteudoChunk, `%${consulta}%`)))
      .limit(limite);

    return rows.map((r) => ({
      id: r.id,
      documentoId: r.documentoId,
      conteudoChunk: r.conteudoChunk,
      ordem: r.ordem,
    }));
  }
}
