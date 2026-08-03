import { pgTable, uuid, text, timestamp, jsonb, numeric, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Alerta (Bounded Context Notificações) — DOMAIN_MODEL.md, SOM Cap. 8.
 * Gerado exclusivamente por `MonitorDeConsistencia` (Domain Service),
 * nunca por ação direta do usuário.
 */
export const alerta = pgTable(
  "alerta",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // enum: build_log_ausente | auditoria_devida | desvio_pilares
    tipo: text("tipo").notNull(),
    condicaoGatilho: text("condicao_gatilho").notNull(),
    entidadeRelacionadaTipo: text("entidade_relacionada_tipo"),
    entidadeRelacionadaId: uuid("entidade_relacionada_id"),
    // enum: ativo | reconhecido | resolvido
    status: text("status").notNull().default("ativo"),
    dataDisparo: timestamp("data_disparo", { withTimezone: true }).notNull().defaultNow(),
    dataResolucao: timestamp("data_resolucao", { withTimezone: true }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    /**
     * Fecha a janela SELECT→INSERT de `garantirAlertaAtivo`
     * (MonitorDeConsistencia): no máximo um Alerta `ativo` por
     * (tipo, entidade_relacionada_id), reforçando em banco a mesma
     * invariante já checada em aplicação por
     * `buscarAtivoPorTipoEEntidade`.
     *
     * ponytail: índice não-expressão — Postgres trata cada NULL de
     * `entidade_relacionada_id` como distinto, então não deduplica sob
     * concorrência quando a entidade é nula (hoje só o tipo
     * `auditoria_devida`, que não referencia entidade nenhuma). Upgrade
     * para índice de expressão com COALESCE se isso virar problema real
     * sob execução concorrente.
     */
    alertaTipoEntidadeAtivoIdx: uniqueIndex("alerta_tipo_entidade_ativo_idx")
      .on(table.tipo, table.entidadeRelacionadaId)
      .where(sql`${table.status} = 'ativo'`),
  })
).enableRLS();

/**
 * AuditoriaDeDrift — execução trimestral da revisão de conteúdo
 * (SOM Cap. 8.2). Nunca altera o Fundamento diretamente — apenas
 * recomenda (invariante do DOMAIN_MODEL.md).
 */
export const auditoriaDrift = pgTable("auditoria_drift", {
  id: uuid("id").primaryKey().defaultRandom(),
  dataExecucao: timestamp("data_execucao", { withTimezone: true }).notNull().defaultNow(),
  pecasAvaliadas: jsonb("pecas_avaliadas").notNull(),
  percentualFalha: numeric("percentual_falha", { precision: 5, scale: 2 }),
  recomendacaoGerada: text("recomendacao_gerada"),
  // enum: agendada | em_execucao | concluida
  status: text("status").notNull().default("agendada"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
