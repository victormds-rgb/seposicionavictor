import { pgTable, uuid, text, jsonb, timestamp, numeric } from "drizzle-orm/pg-core";
import { reuniao } from "./reuniao";

/**
 * Pipeline Comercial (Bounded Context) — DATABASE.md, refinamento
 * pré-ARCHITECTURE, item 5; ARCHITECTURE.md, seção 20.
 *
 * Lead é entidade distinta de Cliente (ADR-006) — nunca "promovida"
 * para Cliente, apenas referenciada por ele após conversão.
 */
export const lead = pgTable("lead", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  origemLead: text("origem_lead"),
  sdrResponsavel: text("sdr_responsavel"),
  // enum: frio | morno | quente
  temperatura: text("temperatura"),
  ticketEstimado: numeric("ticket_estimado", { precision: 12, scale: 2 }),
  // enum: novo | qualificando | qualificado | agendado | reunido | convertido_cliente | perdido
  statusComercial: text("status_comercial").notNull().default("novo"),
  metadata: jsonb("metadata"),
  // Sprint 42 (Fundação Comercial) — colunas novas em `lead`, nenhuma
  // tabela nova. `origemLead` (acima) permanece como detalhe livre
  // histórico; `canalOrigem` é a versão estruturada/agrupável dele
  // (enum fechado, ver src/pipeline_comercial/domain/lead.ts).
  canalOrigem: text("canal_origem"),
  campanha: text("campanha"),
  interesse: text("interesse"),
  // Nunca escrito a partir de `updatedAt` — só por ações que
  // representam contato comercial real (ver
  // src/pipeline_comercial/domain/lead-repository.ts).
  ultimoContatoEm: timestamp("ultimo_contato_em", { withTimezone: true }),
  proximoContatoEm: timestamp("proximo_contato_em", { withTimezone: true }),
  motivoPerda: text("motivo_perda"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const qualificacaoLead = pgTable("qualificacao_lead", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => lead.id),
  resumoQualificacao: text("resumo_qualificacao"),
  doresIdentificadas: jsonb("dores_identificadas"),
  objecoes: text("objecoes"),
  proximoPasso: text("proximo_passo"),
  documentosEnviados: jsonb("documentos_enviados"),
  linksRelevantes: jsonb("links_relevantes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const agendamentoComercial = pgTable("agendamento_comercial", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => lead.id),
  googleCalendarEventId: text("google_calendar_event_id"),
  dataHora: timestamp("data_hora", { withTimezone: true }).notNull(),
  // enum: agendado | confirmado | realizado | no_show | cancelado
  status: text("status").notNull().default("agendado"),
  reuniaoId: uuid("reuniao_id").references(() => reuniao.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
