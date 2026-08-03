import { z } from "zod";
import type { RegistroBrutoRepository } from "@/inbox/domain/registro-bruto-repository";
import { podeSerConfirmado } from "@/inbox/domain/registro-bruto";
import type { SugestaoIARepository } from "@/ia/domain/sugestao-ia-repository";
import { podeTransicionar } from "@/ia/domain/sugestao-ia";
import { TIPOS_DESTINO } from "@/shared/enums/tipo-destino";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";
import type { UuidGenerator } from "@/shared/domain/uuid-generator";

const respostaSchema = z.object({
  sugestaoId: z.string().uuid(),
  decisao: z.enum(["aceitar", "editar", "rejeitar"]),
  tipoDestinoEscolhido: z.enum(TIPOS_DESTINO).optional(),
  motivoRejeicao: z.string().trim().optional(),
});

export type ResponderSugestaoInput = z.infer<typeof respostaSchema>;

export interface ResponderSugestaoDeps {
  registroBrutoRepository: RegistroBrutoRepository;
  sugestaoIARepository: SugestaoIARepository;
  eventPublisher?: IEventPublisher;
  uuidGenerator: UuidGenerator;
}

export class SugestaoNaoEncontradaError extends Error {}
export class SugestaoJaRespondidaError extends Error {}
export class DecisaoInvalidaError extends Error {}

/**
 * Use Case central do princípio "IA sugere, humano decide" (SOM,
 * Cap. 1.7; ADR-005; INTERACTION_MODEL.md, seção 11).
 *
 * - aceitar: cria RegistroBrutoDestino com o tipo sugerido pela IA.
 * - editar: cria RegistroBrutoDestino com o tipo escolhido por Victor,
 *   registrando a diferença em relação à sugestão original.
 * - rejeitar: apenas marca a sugestão como rejeitada; o RegistroBruto
 *   permanece disponível para uma nova sugestão (Use Case separado).
 *
 * Em nenhum caso esta função é chamada automaticamente pela IA — é
 * sempre invocada por uma ação humana explícita (Server Action).
 */
export async function responderSugestao(
  inputBruto: unknown,
  deps: ResponderSugestaoDeps
) {
  const input = respostaSchema.parse(inputBruto);

  const sugestao = await deps.sugestaoIARepository.buscarPorId(input.sugestaoId);
  if (!sugestao) {
    throw new SugestaoNaoEncontradaError(`SugestaoIA ${input.sugestaoId} não encontrada.`);
  }

  const registro = await deps.registroBrutoRepository.buscarPorId(sugestao.entidadeOrigemId);
  if (!registro) {
    throw new SugestaoNaoEncontradaError(
      `RegistroBruto de origem ${sugestao.entidadeOrigemId} não encontrado.`
    );
  }

  if (input.decisao === "rejeitar") {
    if (!podeTransicionar(sugestao.status, "rejeitada")) {
      throw new SugestaoJaRespondidaError(`SugestaoIA ${sugestao.id} já foi respondida.`);
    }
    await deps.sugestaoIARepository.atualizarStatus(sugestao.id, "rejeitada");
    await deps.eventPublisher?.publicar({
      aggregate: "sugestao_ia",
      aggregateId: sugestao.id,
      eventName: "sugestao.rejeitada",
      payload: { motivo: input.motivoRejeicao ?? null },
      actorTipo: "humano",
      source: "inbox.responder_sugestao",
    });
    return { status: "rejeitada" as const };
  }

  // aceitar ou editar
  if (!podeSerConfirmado(registro)) {
    throw new DecisaoInvalidaError(
      `RegistroBruto ${registro.id} não está em um status que permite confirmação.`
    );
  }

  const novoStatusSugestao = input.decisao === "aceitar" ? "aceita" : "editada_e_aceita";
  if (!podeTransicionar(sugestao.status, novoStatusSugestao)) {
    throw new SugestaoJaRespondidaError(`SugestaoIA ${sugestao.id} já foi respondida.`);
  }

  const conteudoOriginal = sugestao.conteudoSugerido as { tipoDestinoSugerido?: string };
  const tipoDestinoFinal =
    input.decisao === "editar"
      ? input.tipoDestinoEscolhido
      : (conteudoOriginal.tipoDestinoSugerido as (typeof TIPOS_DESTINO)[number] | undefined);

  if (!tipoDestinoFinal) {
    throw new DecisaoInvalidaError(
      "tipoDestinoEscolhido é obrigatório ao editar uma sugestão."
    );
  }

  // Destino "mínimo o suficiente para validar a referência"
  // (IMPLEMENTATION_PLAN.md, Sprint 2, Entregável) — a entidade real
  // de destino (Projeto, Tarefa, etc.) é materializada nas Sprints
  // correspondentes; aqui apenas registramos onde ela vai existir.
  const destinoId = deps.uuidGenerator.generate();

  await deps.registroBrutoRepository.criarDestino({
    registroBrutoId: registro.id,
    tipoDestino: tipoDestinoFinal,
    destinoId,
  });

  await deps.sugestaoIARepository.atualizarStatus(sugestao.id, novoStatusSugestao, {
    tipoDestinoSugerido: conteudoOriginal.tipoDestinoSugerido ?? null,
    tipoDestinoFinal,
  });

  await deps.registroBrutoRepository.atualizarStatus(registro.id, "classificado");

  await deps.eventPublisher?.publicar({
    aggregate: "sugestao_ia",
    aggregateId: sugestao.id,
    eventName: "sugestao.aceita",
    payload: { tipoDestinoFinal, editado: input.decisao === "editar" },
    actorTipo: "humano",
    source: "inbox.responder_sugestao",
  });

  await deps.eventPublisher?.publicar({
    aggregate: "registro_bruto",
    aggregateId: registro.id,
    eventName: "registro_bruto.classificado",
    payload: { tipoDestinoFinal, destinoId },
    actorTipo: "humano",
    source: "inbox.responder_sugestao",
  });

  return { status: novoStatusSugestao, tipoDestinoFinal, destinoId };
}
