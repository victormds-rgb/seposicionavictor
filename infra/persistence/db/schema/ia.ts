import { pgTable, uuid, text, jsonb, timestamp, numeric, integer, index } from "drizzle-orm/pg-core";

/**
 * SugestaoIA — Entity de log de auditoria, produzida por Domain Service,
 * sem autoridade própria de Aggregate Root (Revisão Arquitetural do
 * Domínio, registrada em DOMAIN_MODEL.md/DATABASE.md).
 *
 * Nunca escreve em outra entidade sozinha — toda transição para
 * "aceita"/"editada_e_aceita" depende de confirmação humana explícita
 * (ADR-005, INTERACTION_MODEL.md seção 11).
 */
export const sugestaoIa = pgTable(
  "sugestao_ia",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // enum: classificacao | framework | canal | rascunho | qualificacao_lead
    tipoSugestao: text("tipo_sugestao").notNull(),
    entidadeOrigemTipo: text("entidade_origem_tipo").notNull(),
    entidadeOrigemId: uuid("entidade_origem_id").notNull(),
    entidadeAlvoTipo: text("entidade_alvo_tipo"),
    entidadeAlvoId: uuid("entidade_alvo_id"),
    conteudoSugerido: jsonb("conteudo_sugerido").notNull(),
    provider: text("provider"),
    modelo: text("modelo"),
    promptVersion: text("prompt_version"),
    temperatura: numeric("temperatura", { precision: 3, scale: 2 }),
    tokensInput: integer("tokens_input"),
    tokensOutput: integer("tokens_output"),
    custoEstimado: numeric("custo_estimado", { precision: 10, scale: 6 }),
    tempoRespostaMs: integer("tempo_resposta_ms"),
    confianca: numeric("confianca", { precision: 3, scale: 2 }),
    // enum: domain_service | agente_comercial | brand_intelligence
    origemDaSugestao: text("origem_da_sugestao"),
    // enum: pendente | aceita | rejeitada | editada_e_aceita
    status: text("status").notNull().default("pendente"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerModeloIdx: index("idx_sugestao_ia_provider_modelo").on(
      table.provider,
      table.modelo,
      table.createdAt
    ),
  })
).enableRLS();
