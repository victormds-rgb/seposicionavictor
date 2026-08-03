import { pgTable, uuid, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

/**
 * DocumentoOficial (Bounded Context Brand Intelligence) — DATABASE.md
 * (refinamento pré-ARCHITECTURE, item 6); ARCHITECTURE.md, seção 21.
 *
 * Google Drive é a fonte oficial (ADR-004) — esta tabela nunca é
 * editada diretamente por Victor além do cadastro inicial do
 * `google_drive_file_id`; todo o restante vem de sincronização.
 */
export const documentoOficial = pgTable("documento_oficial", {
  id: uuid("id").primaryKey().defaultRandom(),
  titulo: text("titulo").notNull(),
  googleDriveFileId: text("google_drive_file_id").notNull().unique(),
  // enum: sistema_operacional_marca | manual_marca | outro
  tipoDocumento: text("tipo_documento").notNull(),
  ultimaSincronizacao: timestamp("ultima_sincronizacao", { withTimezone: true }),
  hashConteudo: text("hash_conteudo"),
  // enum: nao_indexado | indexado | desatualizado | erro
  statusIndexacao: text("status_indexacao").notNull().default("nao_indexado"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/**
 * DocumentoChunkIndexado — sempre derivado, nunca fonte de verdade
 * (ADR-004). Entidade interna do agregado DocumentoOficial (correção
 * de classificação registrada na revisão da Sprint 8 — análoga a
 * CaseHistorico, Sprint 5), não um Aggregate Root próprio. CASCADE
 * delete: recriável a qualquer momento a partir do Google Drive,
 * nunca precisa de backup próprio (ARCHITECTURE.md, seção 16).
 */
export const documentoChunkIndexado = pgTable("documento_chunk_indexado", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentoId: uuid("documento_id")
    .notNull()
    .references(() => documentoOficial.id, { onDelete: "cascade" }),
  conteudoChunk: text("conteudo_chunk").notNull(),
  embeddingRef: text("embedding_ref"),
  ordem: integer("ordem").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
