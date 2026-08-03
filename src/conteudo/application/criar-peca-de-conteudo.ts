import { z } from "zod";
import type { PecaDeConteudoRepository } from "@/conteudo/domain/peca-de-conteudo-repository";
import { ORIGENS_CONTEUDO } from "@/conteudo/domain/peca-de-conteudo";
import { CANAIS } from "@/shared/enums/canal";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class OrigemInvalidaError extends Error {}

const criarPecaSchema = z.object({
  canal: z.enum(CANAIS),
  pilarId: z.string().uuid(),
  origemTipo: z.enum(ORIGENS_CONTEUDO),
  origemCaseId: z.string().uuid().optional(),
  origemBuildLogId: z.string().uuid().optional(),
  temaId: z.string().uuid().optional(),
  frameworkId: z.string().uuid().optional(),
  serieFixaId: z.string().uuid().optional(),
  conteudoTexto: z.string().trim().optional(),
});

export type CriarPecaInput = z.infer<typeof criarPecaSchema>;

/**
 * Use Case: criar uma Peça de Conteúdo — autônoma, a partir de Case,
 * ou a partir de Build Log (DOMAIN_MODEL.md, entidade PecaDeConteudo).
 * `pilarId` é sempre obrigatório (invariante: toda peça tem Pilar).
 */
export async function criarPecaDeConteudo(
  inputBruto: unknown,
  deps: { pecaDeConteudoRepository: PecaDeConteudoRepository; eventPublisher?: IEventPublisher }
) {
  const input = criarPecaSchema.parse(inputBruto);

  if (input.origemTipo === "case" && !input.origemCaseId) {
    throw new OrigemInvalidaError("origemCaseId é obrigatório quando origemTipo = case.");
  }
  if (input.origemTipo === "build_log" && !input.origemBuildLogId) {
    throw new OrigemInvalidaError("origemBuildLogId é obrigatório quando origemTipo = build_log.");
  }

  const peca = await deps.pecaDeConteudoRepository.criar({
    temaId: input.temaId ?? null,
    frameworkId: input.frameworkId ?? null,
    canal: input.canal,
    serieFixaId: input.serieFixaId ?? null,
    pilarId: input.pilarId,
    status: "rascunho",
    origemTipo: input.origemTipo,
    origemCaseId: input.origemTipo === "case" ? (input.origemCaseId ?? null) : null,
    origemBuildLogId: input.origemTipo === "build_log" ? (input.origemBuildLogId ?? null) : null,
    pecaOrigemId: null,
    conteudoTexto: input.conteudoTexto ?? null,
    dataPublicacao: null,
    metadata: null,
  });

  await deps.eventPublisher?.publicar({
    aggregate: "peca_conteudo",
    aggregateId: peca.id,
    eventName: "conteudo.criado",
    payload: { pilarId: peca.pilarId, canal: peca.canal, origemTipo: peca.origemTipo },
    actorTipo: "humano",
    source: "conteudo.criar_peca",
  });

  return peca;
}
