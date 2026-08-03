import { pgTable, uuid, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { reuniao } from "./reuniao";

/**
 * ItemDeAgenda (Bounded Context Agenda) — DOMAIN_MODEL.md, DATABASE.md.
 *
 * `tarefa_id` permanece uuid simples, SEM FK: o Bounded Context
 * Tarefas ainda não foi implementado (não há Sprint dedicada a ele no
 * IMPLEMENTATION_PLAN.md — lacuna já registrada em
 * src/tarefas/README.md). A referência formal será adicionada quando
 * `tarefa` existir como tabela.
 */
export const itemAgenda = pgTable(
  "item_agenda",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // enum: reuniao | rotina_fixa | tarefa_com_prazo
    tipo: text("tipo").notNull(),
    dataHora: timestamp("data_hora", { withTimezone: true }).notNull(),
    reuniaoId: uuid("reuniao_id").references(() => reuniao.id),
    tarefaId: uuid("tarefa_id"),
    rotinaFixaReferencia: text("rotina_fixa_referencia"),
    recorrente: boolean("recorrente").notNull().default(false),
    // enum: agendado | concluido | perdido
    status: text("status").notNull().default("agendado"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    dataHoraIdx: index("idx_item_agenda_data_hora").on(table.dataHora),
  })
).enableRLS();
