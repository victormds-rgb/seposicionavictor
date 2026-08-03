import type { ProjetoRepository } from "@/projetos/domain/projeto-repository";
import type { CaseRepository } from "@/cases/domain/case-repository";
import { os6CamposCompletos, sugerirCanalPadrao } from "@/cases/domain/case";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class ProjetoNaoEncontradoError extends Error {}
export class ProjetoNaoProntoParaCaseError extends Error {}

export interface CriarCaseDeps {
  projetoRepository: ProjetoRepository;
  caseRepository: CaseRepository;
  eventPublisher?: IEventPublisher;
}

/**
 * Use Case: cria um Case como snapshot dos 6 campos do Projeto de
 * origem (Decisão D3 — cópia, não referência viva: o Case nunca muda
 * retroativamente se o Projeto continuar sendo editado depois).
 *
 * Consome o evento `projeto.pronto_para_case` (DOMAIN_MODEL.md) —
 * nesta Sprint, acionado explicitamente por Victor na Presentation
 * após a transição automática do Projeto, não por um listener
 * assíncrono de evento (ver Riscos Arquiteturais do relatório).
 */
export async function criarCaseAPartirDeProjeto(projetoId: string, deps: CriarCaseDeps) {
  const projeto = await deps.projetoRepository.buscarPorId(projetoId);
  if (!projeto) throw new ProjetoNaoEncontradoError(`Projeto ${projetoId} não encontrado.`);
  if (projeto.status !== "pronto_para_case") {
    throw new ProjetoNaoProntoParaCaseError(
      `Projeto ${projetoId} ainda não está pronto_para_case (status atual: ${projeto.status}).`
    );
  }

  const snapshot = {
    desculpa: projeto.desculpaInicial,
    custo: projeto.custoMensal,
    momentoQuebra: projeto.momentoQuebra,
    solucao: projeto.solucao,
    tempo: projeto.tempoDecorrido,
    numeroResultado: projeto.numeroResultado,
  };

  const status = os6CamposCompletos(snapshot) ? "completo" : "incompleto";

  const caso = await deps.caseRepository.criar({
    projetoId,
    ...snapshot,
    canalSugerido: sugerirCanalPadrao(),
    canalEscolhido: null,
    status,
    metadata: null,
  });

  await deps.caseRepository.registrarHistorico(caso.id, { ...snapshot, evento: "criacao" });

  if (status === "completo") {
    await deps.eventPublisher?.publicar({
      aggregate: "case",
      aggregateId: caso.id,
      eventName: "case.completo",
      payload: { projetoId },
      actorTipo: "humano",
      source: "cases.criar_a_partir_de_projeto",
    });
  }

  return caso;
}
