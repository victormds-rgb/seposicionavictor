import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  numeric,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * Reference Data do Bounded Context "Conhecimento" (DOMAIN_MODEL.md, DATABASE.md).
 * Estas tabelas são raramente escritas e refletem literalmente o conteúdo
 * do SOM.md, Capítulo 2 (Framework, TemaMapeado) e Capítulos 7.1/2.6 (RegraDeDecisao).
 * Nenhuma regra de negócio vive aqui — apenas dado de configuração.
 */

export const framework = pgTable("framework", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  estruturaEtapas: jsonb("estrutura_etapas").notNull(),
  exemplosUso: text("exemplos_uso"),
  // enum: ativo | candidato_a_termo_proprio | obsoleto
  status: text("status").notNull().default("ativo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const temaMapeado = pgTable("tema_mapeado", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomeTema: text("nome_tema").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const temaFramework = pgTable(
  "tema_framework",
  {
    temaId: uuid("tema_id")
      .notNull()
      .references(() => temaMapeado.id),
    frameworkId: uuid("framework_id")
      .notNull()
      .references(() => framework.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.temaId, table.frameworkId] }),
  })
).enableRLS();

export const regraDecisao = pgTable("regra_decisao", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  estruturaArvore: jsonb("estrutura_arvore").notNull(),
  // enum: cliente | conteudo_sem_case
  aplicaA: text("aplica_a").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const serieFixa = pgTable("serie_fixa", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  diaSemanaPadrao: text("dia_semana_padrao"),
  frameworkTipicoId: uuid("framework_tipico_id").references(() => framework.id),
  // enum: ativa | obsoleta
  status: text("status").notNull().default("ativa"),
}).enableRLS();

export const pilar = pgTable("pilar", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  pesoAlvoPercentual: numeric("peso_alvo_percentual", { precision: 5, scale: 2 }).notNull(),
}).enableRLS();
