import type { ReuniaoRepository } from "@/reunioes/domain/reuniao-repository";
import { podeSerMarcadaComoRealizada } from "@/reunioes/domain/reuniao";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class ReuniaoNaoEncontradaError extends Error {}
export class TransicaoInvalidaError extends Error {}

/**
 * Use Case: encerrar a reunião. O evento `reuniao.encerrada` é
 * consumido, na Presentation, como convite à captura na Inbox
 * (INTERACTION_MODEL.md, seção 8 — "encerrar reuniões"; DOMAIN_MODEL.md,
 * consumidor de `reuniao.encerrada`: RegistroBruto/prompt de captura).
 */
export async function marcarReuniaoComoRealizada(
  reuniaoId: string,
  notasBrutas: string | undefined,
  deps: { reuniaoRepository: ReuniaoRepository; eventPublisher?: IEventPublisher }
) {
  const reuniao = await deps.reuniaoRepository.buscarPorId(reuniaoId);
  if (!reuniao) {
    throw new ReuniaoNaoEncontradaError(`Reuniao ${reuniaoId} não encontrada.`);
  }
  if (!podeSerMarcadaComoRealizada(reuniao)) {
    throw new TransicaoInvalidaError(
      `Reuniao ${reuniaoId} não pode ser marcada como realizada no status atual (${reuniao.status}).`
    );
  }

  if (notasBrutas) {
    await deps.reuniaoRepository.atualizarNotasBrutas(reuniaoId, notasBrutas);
  }
  await deps.reuniaoRepository.atualizarStatus(reuniaoId, "realizada");

  await deps.eventPublisher?.publicar({
    aggregate: "reuniao",
    aggregateId: reuniaoId,
    eventName: "reuniao.encerrada",
    payload: {},
    actorTipo: "humano",
    source: "agenda.marcar_como_realizada",
  });
}
