import type { PecaDeConteudoRepository } from "@/conteudo/domain/peca-de-conteudo-repository";
import { podePublicar } from "@/conteudo/domain/peca-de-conteudo";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class PecaNaoEncontradaError extends Error {}
export class TransicaoInvalidaError extends Error {}

const PROXIMA_ETAPA: Record<string, string | null> = {
  rascunho: "em_revisao",
  em_revisao: "agendado",
  agendado: "publicado",
  publicado: null,
};

/**
 * Use Case: avança a Peça de Conteúdo para a próxima etapa do fluxo
 * rascunho → revisão → agendado → publicado (UI_UX.md, seção 10).
 * A transição para `publicado` é tratada por `publicarPeca` (abaixo),
 * que emite o evento catalogado `conteudo.publicado`.
 */
export async function avancarStatusDaPeca(
  pecaId: string,
  deps: { pecaDeConteudoRepository: PecaDeConteudoRepository; eventPublisher?: IEventPublisher }
) {
  const peca = await deps.pecaDeConteudoRepository.buscarPorId(pecaId);
  if (!peca) throw new PecaNaoEncontradaError(`PecaDeConteudo ${pecaId} não encontrada.`);

  const proxima = PROXIMA_ETAPA[peca.status];
  if (!proxima) {
    throw new TransicaoInvalidaError(`PecaDeConteudo ${pecaId} já está em seu status final.`);
  }

  if (proxima === "publicado") {
    return publicarPeca(pecaId, deps);
  }

  await deps.pecaDeConteudoRepository.atualizarStatus(pecaId, proxima as never);
  return deps.pecaDeConteudoRepository.buscarPorId(pecaId);
}

/**
 * Use Case: publicar a Peça de Conteúdo. Invariante: toda peça
 * publicada tem Pilar atribuído (`pilarId` já é NOT NULL desde a
 * criação — reforçado aqui via `podePublicar`). Emite o evento
 * catalogado `conteudo.publicado`.
 */
export async function publicarPeca(
  pecaId: string,
  deps: { pecaDeConteudoRepository: PecaDeConteudoRepository; eventPublisher?: IEventPublisher }
) {
  const peca = await deps.pecaDeConteudoRepository.buscarPorId(pecaId);
  if (!peca) throw new PecaNaoEncontradaError(`PecaDeConteudo ${pecaId} não encontrada.`);
  if (!podePublicar(peca)) {
    throw new TransicaoInvalidaError(
      `PecaDeConteudo ${pecaId} não pode ser publicada no status atual (${peca.status}).`
    );
  }

  const dataPublicacao = new Date();
  await deps.pecaDeConteudoRepository.atualizarStatus(pecaId, "publicado", dataPublicacao);

  await deps.eventPublisher?.publicar({
    aggregate: "peca_conteudo",
    aggregateId: pecaId,
    eventName: "conteudo.publicado",
    payload: { pilarId: peca.pilarId, canal: peca.canal },
    actorTipo: "humano",
    source: "conteudo.publicar",
  });

  return deps.pecaDeConteudoRepository.buscarPorId(pecaId);
}
