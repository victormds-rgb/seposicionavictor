import { z } from "zod";
import type { PecaDeConteudoRepository } from "@/conteudo/domain/peca-de-conteudo-repository";
import { derivacaoValida } from "@/conteudo/domain/peca-de-conteudo";
import { CANAIS } from "@/shared/enums/canal";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class PecaOrigemNaoEncontradaError extends Error {}

/**
 * Erro de domínio disparado quando uma tentativa de derivação viola
 * a regra unidirecional (longo → curto, nunca o inverso — SOM Cap. 9.8).
 * Mantido como erro de aplicação (não bloqueio silencioso) porque essa
 * é a única regra do SOM formulada como proibição categórica, não como
 * princípio de reflexão (SOFTWARE_SPEC.md, seção 10, decisão 1).
 */
export class DerivacaoInvalidaError extends Error {}

const criarDerivacaoSchema = z.object({
  pecaOrigemId: z.string().uuid(),
  canalDerivada: z.enum(CANAIS),
  pilarId: z.string().uuid(),
  conteudoTexto: z.string().trim().optional(),
});

export type CriarDerivacaoInput = z.infer<typeof criarDerivacaoSchema>;

/**
 * Use Case: `ValidadorDeDerivacao` (ARCHITECTURE.md, seção 7),
 * implementado como Use Case da Application do contexto Conteúdo.
 *
 * Se a derivação for inválida, emite o evento catalogado
 * `derivacao.invalida_detectada` (feedback a Victor, DOMAIN_MODEL.md)
 * E lança um erro — a peça nunca é criada nesse caso.
 */
export async function criarDerivacao(
  inputBruto: unknown,
  deps: { pecaDeConteudoRepository: PecaDeConteudoRepository; eventPublisher?: IEventPublisher }
) {
  const input = criarDerivacaoSchema.parse(inputBruto);

  const origem = await deps.pecaDeConteudoRepository.buscarPorId(input.pecaOrigemId);
  if (!origem) {
    throw new PecaOrigemNaoEncontradaError(`Peça de origem ${input.pecaOrigemId} não encontrada.`);
  }

  if (!derivacaoValida(origem.canal, input.canalDerivada)) {
    await deps.eventPublisher?.publicar({
      aggregate: "peca_conteudo",
      aggregateId: origem.id,
      eventName: "derivacao.invalida_detectada",
      payload: { canalOrigem: origem.canal, canalTentativaDerivada: input.canalDerivada },
      actorTipo: "humano",
      source: "conteudo.criar_derivacao",
    });

    throw new DerivacaoInvalidaError(
      `Derivação inválida: "${origem.canal}" não é mais longo que "${input.canalDerivada}" — a derivação só pode ir de peça mais longa para mais curta (SOM Cap. 9.8).`
    );
  }

  return deps.pecaDeConteudoRepository.criar({
    temaId: origem.temaId,
    frameworkId: origem.frameworkId,
    canal: input.canalDerivada,
    serieFixaId: null,
    pilarId: input.pilarId,
    status: "rascunho",
    origemTipo: origem.origemTipo,
    origemCaseId: origem.origemCaseId,
    origemBuildLogId: origem.origemBuildLogId,
    pecaOrigemId: origem.id,
    conteudoTexto: input.conteudoTexto ?? null,
    dataPublicacao: null,
    metadata: null,
  });
}
