import { pgTable, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { projeto } from "./projeto";

/**
 * BuildLog (Bounded Context Build Logs) — DOMAIN_MODEL.md, SOM Cap. 4.4.
 * Formato fixo de 4 campos (Contexto/Quebra/Decisão/Próximo Passo).
 */
export const buildLog = pgTable(
  "build_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projetoId: uuid("projeto_id")
      .notNull()
      .references(() => projeto.id),
    contexto: text("contexto"),
    quebra: text("quebra"),
    decisao: text("decisao"),
    proximoPasso: text("proximo_passo"),
    // enum: rascunho | publicado
    status: text("status").notNull().default("rascunho"),
    dataPublicacao: timestamp("data_publicacao", { withTimezone: true }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    dataPublicacaoIdx: index("idx_build_log_data_publicacao").on(table.dataPublicacao),
  })
).enableRLS();
