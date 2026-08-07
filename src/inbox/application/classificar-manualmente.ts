import { z } from "zod";
import type { RegistroBrutoRepository } from "@/inbox/domain/registro-bruto-repository";
import { podeSerConfirmado } from "@/inbox/domain/registro-bruto";
import { TIPOS_DESTINO } from "@/shared/enums/tipo-destino";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";
import type { UuidGenerator } from "@/shared/domain/uuid-generator";

const inputSchema = z.object({
  registroBrutoId: z.string().uuid(),
  tipoDestinoEscolhido: z.enum(TIPOS_DESTINO),
});

export type ClassificarManualmenteInput = z.infer<typeof inputSchema>;

export interface ClassificarManualmenteDeps {
  registroBrutoRepository: RegistroBrutoRepository;
  eventPublisher?: IEventPublisher;
  uuidGenerator: UuidGenerator;
}

export class RegistroBrutoNaoEncontradoError extends Error {}
export class DecisaoInvalidaError extends Error {}

/**
 * Use Case: classificação manual de um RegistroBruto sem passar por
 * SugestaoIA (Sprint 23 — DOGFOODING_REPORT.md, item 1). Sem IA
 * configurada, `capturarRegistroBruto` já deixa o registro em
 * `capturado` de forma graciosa (Sprint 22) — mas antes desta função
 * não havia nenhuma ação humana possível a partir daí além de
 * descartar. `podeSerConfirmado` (registro-bruto.ts) já permitia
 * confirmar a partir de `capturado`; faltava só este caminho que não
 * depende de uma SugestaoIA existir. Mesmo efeito de `responderSugestao`
 * (decisão "editar"), só que sem sugestão de origem.
 *
 * Rastreabilidade (Sprint 23A — revisão pós-commit): o fluxo por IA
 * publica dois eventos — `sugestao.aceita` (aggregate `sugestao_ia`)
 * e `registro_bruto.classificado` (aggregate `registro_bruto`). Aqui
 * não existe SugestaoIA nenhuma para gerar o primeiro — reutilizá-lo
 * ou simulá-lo fabricaria um rastro de IA que nunca existiu. Em vez
 * disso, publica-se `registro_bruto.classificado_manualmente` (mesmo
 * aggregate `registro_bruto`, nome novo, sem tabela nova) ao lado do
 * `registro_bruto.classificado` já existente — mantendo a
 * rastreabilidade sem inventar dado que não aconteceu.
 */
export async function classificarManualmente(
  inputBruto: unknown,
  deps: ClassificarManualmenteDeps
) {
  const input = inputSchema.parse(inputBruto);

  const registro = await deps.registroBrutoRepository.buscarPorId(input.registroBrutoId);
  if (!registro) {
    throw new RegistroBrutoNaoEncontradoError(`RegistroBruto ${input.registroBrutoId} não encontrado.`);
  }
  if (!podeSerConfirmado(registro)) {
    throw new DecisaoInvalidaError(
      `RegistroBruto ${registro.id} não está em um status que permite confirmação.`
    );
  }

  const destinoId = deps.uuidGenerator.generate();

  await deps.registroBrutoRepository.criarDestino({
    registroBrutoId: registro.id,
    tipoDestino: input.tipoDestinoEscolhido,
    destinoId,
  });

  await deps.registroBrutoRepository.atualizarStatus(registro.id, "classificado");

  await deps.eventPublisher?.publicar({
    aggregate: "registro_bruto",
    aggregateId: registro.id,
    eventName: "registro_bruto.classificado",
    payload: { tipoDestinoFinal: input.tipoDestinoEscolhido, destinoId },
    actorTipo: "humano",
    source: "inbox.classificar_manualmente",
  });

  // Evento próprio da classificação manual (ver nota acima) — o
  // equivalente ao `sugestao.aceita` do fluxo por IA, sem fingir que
  // uma SugestaoIA existiu.
  await deps.eventPublisher?.publicar({
    aggregate: "registro_bruto",
    aggregateId: registro.id,
    eventName: "registro_bruto.classificado_manualmente",
    payload: { tipoDestinoFinal: input.tipoDestinoEscolhido, destinoId },
    actorTipo: "humano",
    source: "inbox.classificar_manualmente",
  });

  return { tipoDestinoFinal: input.tipoDestinoEscolhido, destinoId };
}
