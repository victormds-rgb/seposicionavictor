import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  bigint,
  index,
} from "drizzle-orm/pg-core";
import { reuniao } from "./reuniao";

/**
 * Inbox Universal (DATABASE.md, refinamento pré-ARCHITECTURE, item 1;
 * DOMAIN_MODEL.md, entidade RegistroBruto).
 *
 * `reuniao_id` agora referencia formalmente `reuniao.id` (FK adicionada
 * na Sprint 3, conforme já anunciado no comentário original da
 * Sprint 2: "a referência formal deve ser adicionada em migration
 * própria quando `reuniao` for criada").
 */
export const registroBruto = pgTable(
  "registro_bruto",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // enum: texto | audio | imagem | pdf | video | print | email |
    //       documento | link | mensagem | observacao | transcricao | outro
    tipoEntrada: text("tipo_entrada").notNull(),
    conteudoTexto: text("conteudo_texto"),
    conteudoBinarioRef: text("conteudo_binario_ref"),
    mimeType: text("mime_type"),
    tamanhoBytes: bigint("tamanho_bytes", { mode: "number" }),
    dataCaptura: timestamp("data_captura", { withTimezone: true }).notNull().defaultNow(),
    // enum: reuniao | aprendizado | ideia | email | whatsapp | outro
    origem: text("origem").notNull(),
    reuniaoId: uuid("reuniao_id").references(() => reuniao.id),
    // enum: capturado | em_processamento | classificacao_sugerida | classificado | descartado
    status: text("status").notNull().default("capturado"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("idx_registro_bruto_status").on(table.status),
    dataCapturaIdx: index("idx_registro_bruto_data_captura").on(table.dataCaptura),
  })
).enableRLS();

/**
 * Relação de destino — polimórfica, sem FK de banco (DATABASE.md,
 * Decisão DE1): `destinoId` referencia uma entidade de outro Bounded
 * Context (Projeto, BuildLog, PecaDeConteudo, Tarefa, AtivoDeConhecimento)
 * que, nesta Sprint, ainda não existe como tabela própria. O valor é
 * um identificador gerado no momento da confirmação humana — a
 * materialização real da entidade de destino é responsabilidade das
 * Sprints correspondentes (IMPLEMENTATION_PLAN.md, Sprint 2, Entregável).
 */
export const registroBrutoDestino = pgTable("registro_bruto_destino", {
  id: uuid("id").primaryKey().defaultRandom(),
  registroBrutoId: uuid("registro_bruto_id")
    .notNull()
    .references(() => registroBruto.id),
  // enum: projeto | build_log | peca_conteudo | tarefa | ativo_conhecimento
  tipoDestino: text("tipo_destino").notNull(),
  destinoId: uuid("destino_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
