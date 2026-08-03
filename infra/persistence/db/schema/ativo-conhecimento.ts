import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * AtivoDeConhecimento (Bounded Context Conhecimento) — SOM Cap. 2.3
 * (Banco de Perguntas Recorrentes) e 2.4 (Banco de Analogias),
 * consolidados numa única tabela (Decisão D7 da Revisão Arquitetural).
 */
export const ativoConhecimento = pgTable("ativo_conhecimento", {
  id: uuid("id").primaryKey().defaultRandom(),
  // enum: pergunta_recorrente | analogia
  tipo: text("tipo").notNull(),
  conteudoTextual: text("conteudo_textual").notNull(),
  origem: text("origem"),
  frequenciaUso: integer("frequencia_uso").notNull().default(0),
  // enum: ativo | arquivado
  status: text("status").notNull().default("ativo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
