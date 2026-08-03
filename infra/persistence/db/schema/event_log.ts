import { pgTable, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";

/**
 * event_log — observabilidade de domínio (DATABASE.md, refinamento pré-ARCHITECTURE, item 4).
 * Explicitamente NÃO é Event Sourcing: é log append-only para consulta e
 * auditoria ("o que aconteceu, quando, por quem"), nunca fonte de
 * reconstrução de estado (ARCHITECTURE.md, ADR-003).
 *
 * Referências polimórficas (aggregate/aggregate_id) são resolvidas pela
 * camada de aplicação, sem FK de banco (DATABASE.md, Decisão DE1).
 */
export const eventLog = pgTable(
  "event_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    aggregate: text("aggregate").notNull(),
    aggregateId: uuid("aggregate_id").notNull(),
    eventName: text("event_name").notNull(),
    payload: jsonb("payload").notNull(),
    // enum: humano | ia | sistema
    actorTipo: text("actor_tipo").notNull(),
    actorId: text("actor_id"),
    source: text("source"),
    correlationId: uuid("correlation_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Índices conforme DATABASE.md (seção event_log):
    // (aggregate, aggregate_id, created_at), (correlation_id), (created_at)
    aggregateIdx: index("idx_event_log_aggregate").on(
      table.aggregate,
      table.aggregateId,
      table.createdAt
    ),
    correlationIdx: index("idx_event_log_correlation").on(table.correlationId),
    createdAtIdx: index("idx_event_log_created_at").on(table.createdAt),
  })
).enableRLS();
