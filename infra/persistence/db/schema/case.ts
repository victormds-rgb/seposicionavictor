import { pgTable, uuid, text, jsonb, timestamp, numeric } from "drizzle-orm/pg-core";
import { projeto } from "./projeto";

/**
 * Case (Bounded Context Cases) — DOMAIN_MODEL.md, DATABASE.md.
 * Ativo de maior valor de marca (SOM, Cap. 1.7, princípio 4: "prova
 * pública substitui promessa"). Nasce como snapshot dos campos do
 * Projeto de origem (Decisão D3 — cópia, não referência viva).
 */
export const caseTable = pgTable("case", {
  id: uuid("id").primaryKey().defaultRandom(),
  projetoId: uuid("projeto_id")
    .notNull()
    .references(() => projeto.id),
  desculpa: text("desculpa"),
  custo: numeric("custo", { precision: 12, scale: 2 }),
  momentoQuebra: text("momento_quebra"),
  solucao: text("solucao"),
  tempo: text("tempo"),
  numeroResultado: text("numero_resultado"),
  // enum: linkedin | instagram | x | youtube | newsletter
  canalSugerido: text("canal_sugerido"),
  canalEscolhido: text("canal_escolhido"),
  // enum: incompleto | completo | publicado
  status: text("status").notNull().default("incompleto"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/**
 * case_historico — append-only, nunca editado ou apagado
 * (NFR de auditabilidade, SOFTWARE_SPEC.md seção 6).
 */
export const caseHistorico = pgTable("case_historico", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => caseTable.id),
  snapshot: jsonb("snapshot").notNull(),
  alteradoEm: timestamp("alterado_em", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
