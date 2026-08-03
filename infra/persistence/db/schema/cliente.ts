import { pgTable, uuid, text, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { lead } from "./pipeline-comercial";

/**
 * Cliente (Bounded Context Clientes) — DATABASE.md, DOMAIN_MODEL.md.
 *
 * `origem_lead_id` — DECISÃO DE ENGENHARIA DESTA SPRINT: a lista de
 * colunas de `cliente` no DATABASE.md original não incluía este
 * campo, mas ARCHITECTURE.md (seção 20) e o Critério de Aceite da
 * Sprint 4 do IMPLEMENTATION_PLAN.md exigem explicitamente que "um
 * Lead convertido mantenha referência de origem (`lead_id`) sem que
 * Lead e Cliente sejam tratados como o mesmo registro". Isso é
 * implementação de uma decisão já documentada (ADR-006), preenchendo
 * uma lacuna de coluna no DATABASE.md, não uma regra de negócio nova
 * — sinalizado no relatório da Sprint 4.
 */
export const cliente = pgTable("cliente", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  setor: text("setor"),
  temAutoridadeReal: boolean("tem_autoridade_real"),
  aceitaDiagnostico: boolean("aceita_diagnostico"),
  sinalNaoCumprimento: boolean("sinal_nao_cumprimento"),
  // enum: prioridade_alta | cliente_de_caixa | exigir_contrato_reforcado
  classificacaoResultante: text("classificacao_resultante"),
  // enum: baixa | media | alta
  urgenciaFinanceira: text("urgencia_financeira"),
  // enum: lead | em_avaliacao | ativo | encerrado
  status: text("status").notNull().default("lead"),
  origemLeadId: uuid("origem_lead_id").references(() => lead.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
