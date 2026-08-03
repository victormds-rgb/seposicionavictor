import { z } from "zod";
import type { ProjetoRepository } from "@/projetos/domain/projeto-repository";
import { podeSerSatisfeito } from "@/projetos/domain/criterio-de-lancamento";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class CriterioNaoEncontradoError extends Error {}
export class TransicaoInvalidaError extends Error {}
export class ProjetoInvalidoParaCriterioError extends Error {}

const criarCriterioSchema = z.object({
  projetoId: z.string().uuid(),
  descricaoFeature: z.string().trim().min(1),
});

/**
 * Use Case: registrar um novo critério de lançamento para uma feature
 * de produto próprio (SOM Cap. 7.2). Só faz sentido para Projeto do
 * tipo `produto_proprio`.
 */
export async function criarCriterioDeLancamento(
  inputBruto: unknown,
  deps: { projetoRepository: ProjetoRepository; eventPublisher?: IEventPublisher }
) {
  const input = criarCriterioSchema.parse(inputBruto);

  const projeto = await deps.projetoRepository.buscarPorId(input.projetoId);
  if (!projeto) throw new CriterioNaoEncontradoError(`Projeto ${input.projetoId} não encontrado.`);
  if (projeto.tipo !== "produto_proprio") {
    throw new ProjetoInvalidoParaCriterioError(
      "Critério de Lançamento só se aplica a Projetos do tipo produto_proprio."
    );
  }

  return deps.projetoRepository.criarCriterioDeLancamento({
    projetoId: input.projetoId,
    descricaoFeature: input.descricaoFeature,
    status: "pendente",
    dataConfirmacao: null,
  });
}

/**
 * Use Case: satisfazer um Critério de Lançamento — só por confirmação
 * humana explícita (SOM Cap. 7.2; ADR-005). Emite o evento catalogado
 * `criterio_lancamento.satisfeito`.
 */
export async function satisfazerCriterioDeLancamento(
  criterioId: string,
  deps: { projetoRepository: ProjetoRepository; eventPublisher?: IEventPublisher }
) {
  const criterio = await deps.projetoRepository.buscarCriterioPorId(criterioId);
  if (!criterio) {
    throw new CriterioNaoEncontradoError(`CriterioDeLancamento ${criterioId} não encontrado.`);
  }
  if (!podeSerSatisfeito(criterio)) {
    throw new TransicaoInvalidaError(
      `CriterioDeLancamento ${criterioId} não pode ser satisfeito no status atual (${criterio.status}).`
    );
  }

  const agora = new Date();
  await deps.projetoRepository.atualizarStatusCriterio(criterioId, "satisfeito", agora);

  await deps.eventPublisher?.publicar({
    aggregate: "criterio_lancamento",
    aggregateId: criterioId,
    eventName: "criterio_lancamento.satisfeito",
    payload: { descricaoFeature: criterio.descricaoFeature },
    actorTipo: "humano",
    source: "projetos.satisfazer_criterio",
  });
}
