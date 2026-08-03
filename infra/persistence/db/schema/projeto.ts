import { pgTable, uuid, text, jsonb, timestamp, numeric } from "drizzle-orm/pg-core";
import { cliente } from "./cliente";

/**
 * Projeto (Bounded Context Projetos) — DOMAIN_MODEL.md, DATABASE.md.
 *
 * `cliente_id` agora referencia formalmente `cliente.id` (a tabela
 * `cliente` nasceu na Sprint 4). Nulo quando `tipo = produto_proprio`.
 */
export const projeto = pgTable("projeto", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  // enum: cliente_externo | produto_proprio
  tipo: text("tipo").notNull(),
  clienteId: uuid("cliente_id").references(() => cliente.id),
  desculpaInicial: text("desculpa_inicial"),
  custoMensal: numeric("custo_mensal", { precision: 12, scale: 2 }),
  momentoQuebra: text("momento_quebra"),
  solucao: text("solucao"),
  tempoDecorrido: text("tempo_decorrido"),
  numeroResultado: text("numero_resultado"),
  // enum: iniciado | em_andamento | pronto_para_case | encerrado
  status: text("status").notNull().default("iniciado"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/**
 * CriterioDeLancamento — entidade interna do agregado Projeto
 * (Decisão D4 da Revisão Arquitetural do Domínio). CASCADE delete:
 * nunca existe órfão fora do Projeto que a contém.
 */
export const criterioLancamento = pgTable("criterio_lancamento", {
  id: uuid("id").primaryKey().defaultRandom(),
  projetoId: uuid("projeto_id")
    .notNull()
    .references(() => projeto.id, { onDelete: "cascade" }),
  descricaoFeature: text("descricao_feature").notNull(),
  // enum: pendente | satisfeito
  status: text("status").notNull().default("pendente"),
  dataConfirmacao: timestamp("data_confirmacao", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
