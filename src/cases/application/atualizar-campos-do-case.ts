import { z } from "zod";
import type { CaseRepository, CampoDeCaseEditavel } from "@/cases/domain/case-repository";
import { os6CamposCompletos, CANAIS } from "@/cases/domain/case";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class CaseNaoEncontradoError extends Error {}

const atualizarCamposSchema = z.object({
  caseId: z.string().uuid(),
  desculpa: z.string().trim().optional(),
  custo: z.number().optional(),
  momentoQuebra: z.string().trim().optional(),
  solucao: z.string().trim().optional(),
  tempo: z.string().trim().optional(),
  numeroResultado: z.string().trim().optional(),
  canalEscolhido: z.enum(CANAIS).optional(),
});

export type AtualizarCamposDoCaseInput = z.infer<typeof atualizarCamposSchema>;

/**
 * Use Case: edita os campos de um Case já criado.
 *
 * Invariante de auditabilidade (SOFTWARE_SPEC.md, seção 6): TODA
 * edição gera uma entrada em `case_historico` — o snapshot é
 * registrado ANTES de aplicar a mudança, preservando o estado
 * anterior de forma imutável (append-only).
 */
export async function atualizarCamposDoCase(
  inputBruto: unknown,
  deps: { caseRepository: CaseRepository; eventPublisher?: IEventPublisher }
) {
  const input = atualizarCamposSchema.parse(inputBruto);

  const casoAtual = await deps.caseRepository.buscarPorId(input.caseId);
  if (!casoAtual) throw new CaseNaoEncontradoError(`Case ${input.caseId} não encontrado.`);

  // Snapshot do estado ANTERIOR, preservado antes de qualquer mudança.
  await deps.caseRepository.registrarHistorico(input.caseId, {
    desculpa: casoAtual.desculpa,
    custo: casoAtual.custo,
    momentoQuebra: casoAtual.momentoQuebra,
    solucao: casoAtual.solucao,
    tempo: casoAtual.tempo,
    numeroResultado: casoAtual.numeroResultado,
    canalEscolhido: casoAtual.canalEscolhido,
    evento: "edicao",
  });

  const campos: CampoDeCaseEditavel = {
    desculpa: input.desculpa,
    custo: input.custo,
    momentoQuebra: input.momentoQuebra,
    solucao: input.solucao,
    tempo: input.tempo,
    numeroResultado: input.numeroResultado,
    canalEscolhido: input.canalEscolhido,
  };

  const casoAtualizado = await deps.caseRepository.atualizarCampos(input.caseId, campos);

  const jaEstavaCompleto = casoAtual.status !== "incompleto";
  const agoraCompleto = os6CamposCompletos(casoAtualizado);

  if (!jaEstavaCompleto && agoraCompleto) {
    await deps.caseRepository.atualizarStatus(input.caseId, "completo");
    await deps.eventPublisher?.publicar({
      aggregate: "case",
      aggregateId: input.caseId,
      eventName: "case.completo",
      payload: {},
      actorTipo: "humano",
      source: "cases.atualizar_campos",
    });
  } else if (jaEstavaCompleto && !agoraCompleto && casoAtual.status !== "publicado") {
    // Invariante: nunca `completo` com campo ausente — reverte para
    // `incompleto` se uma edição remover um campo obrigatório.
    await deps.caseRepository.atualizarStatus(input.caseId, "incompleto");
  }

  return deps.caseRepository.buscarPorId(input.caseId);
}
