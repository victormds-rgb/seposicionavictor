import { z } from "zod";
import type { ProjetoRepository } from "@/projetos/domain/projeto-repository";
import { podeTransicionarParaProntoParaCase } from "@/projetos/domain/projeto";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class ProjetoNaoEncontradoError extends Error {}

const atualizarCamposSchema = z.object({
  projetoId: z.string().uuid(),
  momentoQuebra: z.string().trim().optional(),
  solucao: z.string().trim().optional(),
  tempoDecorrido: z.string().trim().optional(),
  numeroResultado: z.string().trim().optional(),
});

export type AtualizarCamposDeCaseInput = z.infer<typeof atualizarCamposSchema>;

/**
 * Use Case: atualiza os campos do formato de case dentro do Projeto
 * (momento_quebra, solução, tempo, número — SOM Cap. 5.1). Quando os
 * 6 campos ficam completos, transiciona automaticamente para
 * `pronto_para_case` e emite o evento catalogado
 * `projeto.pronto_para_case`, que dispara a criação do Case
 * (ARCHITECTURE.md, seção 6).
 */
export async function atualizarCamposDeCaseDoProjeto(
  inputBruto: unknown,
  deps: { projetoRepository: ProjetoRepository; eventPublisher?: IEventPublisher }
) {
  const input = atualizarCamposSchema.parse(inputBruto);

  const projetoAtual = await deps.projetoRepository.buscarPorId(input.projetoId);
  if (!projetoAtual) {
    throw new ProjetoNaoEncontradoError(`Projeto ${input.projetoId} não encontrado.`);
  }

  await deps.projetoRepository.atualizarCamposDeCase(input.projetoId, {
    momentoQuebra: input.momentoQuebra,
    solucao: input.solucao,
    tempoDecorrido: input.tempoDecorrido,
    numeroResultado: input.numeroResultado,
  });

  const projetoAtualizado = await deps.projetoRepository.buscarPorId(input.projetoId);
  if (!projetoAtualizado) {
    throw new ProjetoNaoEncontradoError(`Projeto ${input.projetoId} não encontrado após atualização.`);
  }

  if (podeTransicionarParaProntoParaCase(projetoAtualizado)) {
    await deps.projetoRepository.atualizarStatus(input.projetoId, "pronto_para_case");

    await deps.eventPublisher?.publicar({
      aggregate: "projeto",
      aggregateId: input.projetoId,
      eventName: "projeto.pronto_para_case",
      payload: {},
      actorTipo: "humano",
      source: "projetos.atualizar_campos_de_case",
    });
  }

  return deps.projetoRepository.buscarPorId(input.projetoId);
}
