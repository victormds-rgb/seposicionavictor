import { pgTable, uuid, text, timestamp, jsonb, index, type AnyPgColumn } from "drizzle-orm/pg-core";
import { temaMapeado, framework, serieFixa, pilar } from "./conhecimento";
import { caseTable } from "./case";
import { buildLog } from "./build-log";

/**
 * PecaDeConteudo (Bounded Context Conteúdo) — DOMAIN_MODEL.md,
 * SOM Cap. 2, 3, 9.
 *
 * DECISÃO DE ENGENHARIA DESTA SPRINT: `tema_id` está NULLABLE aqui,
 * divergindo do texto original do DATABASE.md (que o listava sem a
 * anotação "nullable", implicando NOT NULL). Isso é necessário porque
 * o Bounded Context Conhecimento (Sprint 7) — que povoa `tema_mapeado`
 * — ainda não foi implementado nesta Sprint. Exigir `tema_id NOT NULL`
 * agora tornaria impossível criar qualquer Peça de Conteúdo antes da
 * Sprint 7. Sinalizado no relatório da Sprint 6 como item de
 * governança (padrão já usado para AB-001/AB-002).
 */
export const pecaConteudo = pgTable(
  "peca_conteudo",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    temaId: uuid("tema_id").references(() => temaMapeado.id),
    frameworkId: uuid("framework_id").references(() => framework.id),
    // enum: linkedin | instagram | x | youtube | newsletter
    canal: text("canal").notNull(),
    serieFixaId: uuid("serie_fixa_id").references(() => serieFixa.id),
    pilarId: uuid("pilar_id")
      .notNull()
      .references(() => pilar.id),
    // enum: rascunho | em_revisao | agendado | publicado
    status: text("status").notNull().default("rascunho"),
    // enum: case | build_log | autonomo
    origemTipo: text("origem_tipo").notNull(),
    origemCaseId: uuid("origem_case_id").references(() => caseTable.id),
    origemBuildLogId: uuid("origem_build_log_id").references(() => buildLog.id),
    pecaOrigemId: uuid("peca_origem_id").references((): AnyPgColumn => pecaConteudo.id),
    conteudoTexto: text("conteudo_texto"),
    dataPublicacao: timestamp("data_publicacao", { withTimezone: true }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pilarStatusIdx: index("idx_peca_conteudo_pilar_status").on(
      table.pilarId,
      table.status,
      table.dataPublicacao
    ),
  })
).enableRLS();
