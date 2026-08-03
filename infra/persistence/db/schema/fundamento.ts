import { pgTable, uuid, text, jsonb, timestamp, integer } from "drizzle-orm/pg-core";

/**
 * Aggregate Root "Fundamento" (DOMAIN_MODEL.md, seção 1; DATABASE.md).
 * Entidade singleton — nunca deve haver mais de uma linha com status = 'ativo'.
 * Essa invariante é responsabilidade do Domain/Application, não é expressa
 * como constraint de banco nesta fase (DATABASE.md, convenções gerais).
 */

export const fundamento = pgTable("fundamento", {
  id: uuid("id").primaryKey().defaultRandom(),
  filosofia: text("filosofia").notNull(),
  bigIdea: text("big_idea").notNull(),
  fraseAncora: text("frase_ancora").notNull(),
  manifesto: text("manifesto").notNull(),
  // lista de 5 strings (SOM.md, Cap. 1.7)
  principiosOperacionais: jsonb("principios_operacionais").notNull(),
  // lista de strings (SOM.md, Cap. 1.8 — "o que a marca não é")
  naoE: jsonb("nao_e").notNull(),
  // enum: ativo | em_revisao
  status: text("status").notNull().default("ativo"),
  versao: integer("versao").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const fundamentoHistorico = pgTable("fundamento_historico", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundamentoId: uuid("fundamento_id")
    .notNull()
    .references(() => fundamento.id),
  versao: integer("versao").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  alteradoEm: timestamp("alterado_em", { withTimezone: true }).notNull().defaultNow(),
  motivo: text("motivo"),
}).enableRLS();
