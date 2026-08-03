import type { ReuniaoRepository } from "@/reunioes/domain/reuniao-repository";
import { podeSerProcessada } from "@/reunioes/domain/reuniao";
import type { RegistroBrutoRepository } from "@/inbox/domain/registro-bruto-repository";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class ReuniaoNaoEncontradaError extends Error {}
export class TransicaoInvalidaError extends Error {}

export interface MarcarReuniaoComoProcessadaDeps {
  reuniaoRepository: ReuniaoRepository;
  registroBrutoRepository: RegistroBrutoRepository;
  eventPublisher?: IEventPublisher;
}

/**
 * Use Case: marca a Reuniao como processada.
 *
 * Invariante (DOMAIN_MODEL.md): "Uma Reuniao nunca é `processada` sem
 * RegistroBruto associado classificado." A verificação cruza para o
 * Bounded Context Inbox via seu repositório (leitura, não escrita —
 * não viola a fronteira entre contextos, apenas consulta um dado já
 * público através da interface de repositório já existente).
 */
export async function marcarReuniaoComoProcessada(
  reuniaoId: string,
  deps: MarcarReuniaoComoProcessadaDeps
) {
  const reuniao = await deps.reuniaoRepository.buscarPorId(reuniaoId);
  if (!reuniao) {
    throw new ReuniaoNaoEncontradaError(`Reuniao ${reuniaoId} não encontrada.`);
  }

  const registrosDaReuniao = await deps.registroBrutoRepository.listar({ reuniaoId });
  const temRegistroClassificado = registrosDaReuniao.some((r) => r.status === "classificado");

  if (!podeSerProcessada(reuniao, temRegistroClassificado)) {
    throw new TransicaoInvalidaError(
      `Reuniao ${reuniaoId} não pode ser processada: status atual (${reuniao.status}) ou nenhum RegistroBruto classificado associado.`
    );
  }

  await deps.reuniaoRepository.atualizarStatus(reuniaoId, "processada");

  await deps.eventPublisher?.publicar({
    aggregate: "reuniao",
    aggregateId: reuniaoId,
    eventName: "reuniao.processada",
    payload: {},
    actorTipo: "humano",
    source: "agenda.marcar_como_processada",
  });
}
