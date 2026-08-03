import type { CaseRepository } from "@/cases/domain/case-repository";
import { podeSerPublicado } from "@/cases/domain/case";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class CaseNaoEncontradoError extends Error {}
export class CaseNaoPodeSerPublicadoError extends Error {}

/**
 * Use Case: publicar um Case — só permitido quando `completo`
 * (invariante do DOMAIN_MODEL.md). Emite o evento catalogado
 * `case.publicado`.
 */
export async function publicarCase(caseId: string, deps: { caseRepository: CaseRepository; eventPublisher?: IEventPublisher }) {
  const caso = await deps.caseRepository.buscarPorId(caseId);
  if (!caso) throw new CaseNaoEncontradoError(`Case ${caseId} não encontrado.`);
  if (!podeSerPublicado(caso)) {
    throw new CaseNaoPodeSerPublicadoError(
      `Case ${caseId} não pode ser publicado no status atual (${caso.status}).`
    );
  }

  await deps.caseRepository.atualizarStatus(caseId, "publicado");

  await deps.eventPublisher?.publicar({
    aggregate: "case",
    aggregateId: caseId,
    eventName: "case.publicado",
    payload: { canalEscolhido: caso.canalEscolhido },
    actorTipo: "humano",
    source: "cases.publicar",
  });
}

export async function listarCasesDoProjeto(
  projetoId: string,
  deps: { caseRepository: CaseRepository }
) {
  return deps.caseRepository.buscarPorProjetoId(projetoId);
}

export async function listarHistoricoDoCase(
  caseId: string,
  deps: { caseRepository: CaseRepository }
) {
  return deps.caseRepository.listarHistorico(caseId);
}
