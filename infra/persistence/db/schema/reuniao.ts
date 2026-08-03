import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * Reuniao (Bounded Context Reuniões) — DOMAIN_MODEL.md, DATABASE.md.
 *
 * `cliente_id` e `projeto_id` permanecem como uuid simples, SEM FK:
 * as tabelas `cliente` (Sprint 4) e `projeto` (Sprint 5) ainda não
 * existem. Mesma decisão já aplicada a `registro_bruto.reuniao_id`
 * na Sprint 2 — será formalizada com FK quando essas tabelas nascerem.
 */
export const reuniao = pgTable("reuniao", {
  id: uuid("id").primaryKey().defaultRandom(),
  dataHora: timestamp("data_hora", { withTimezone: true }).notNull(),
  participantes: jsonb("participantes"),
  clienteId: uuid("cliente_id"),
  projetoId: uuid("projeto_id"),
  local: text("local"),
  notasBrutas: text("notas_brutas"),
  // enum: agendada | realizada | processada | cancelada
  status: text("status").notNull().default("agendada"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
