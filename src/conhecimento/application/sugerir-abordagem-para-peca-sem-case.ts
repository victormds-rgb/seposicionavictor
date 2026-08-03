import { z } from "zod";
import {
  avaliarPecaSemCase,
  type RecomendacaoSemCase,
} from "@/conhecimento/domain/arvore-framework-sem-case";
import type { TemaMapeadoRepository } from "@/conhecimento/domain/conhecimento-repository";

const sugerirAbordagemSchema = z.object({
  temaId: z.string().uuid().optional(),
  temCasoPessoalOuDeCliente: z.boolean(),
  ehTendenciaOuNoticiaDeTerceiros: z.boolean(),
  ehReflexaoPessoalOuAprendizado: z.boolean(),
});

export type SugerirAbordagemInput = z.infer<typeof sugerirAbordagemSchema>;

export interface SugestaoDeAbordagem {
  recomendacao: RecomendacaoSemCase;
  frameworksDoTema: string[];
}

/**
 * Use Case: aplica a árvore de decisão "Framework sem Case" (SOM
 * Cap. 2.6) e, quando o tema informado já tem framework(s) mapeado(s)
 * (SOM Cap. 2.5), sugere qual usar — sem nunca escolher
 * automaticamente por Victor (a escolha final é sempre humana,
 * mesmo princípio de "IA sugere, humano decide" aplicado aqui a
 * regras determinísticas, não a IA generativa).
 *
 * Satisfaz o Critério de Aceite da Sprint 7: "Uma Peça de Conteúdo
 * sem Case associado pode ser criada seguindo a árvore de decisão do
 * Cap. 2.6."
 */
export async function sugerirAbordagemParaPecaSemCase(
  inputBruto: unknown,
  deps: { temaMapeadoRepository: TemaMapeadoRepository }
): Promise<SugestaoDeAbordagem> {
  const input = sugerirAbordagemSchema.parse(inputBruto);

  const recomendacao = avaliarPecaSemCase({
    temCasoPessoalOuDeCliente: input.temCasoPessoalOuDeCliente,
    ehTendenciaOuNoticiaDeTerceiros: input.ehTendenciaOuNoticiaDeTerceiros,
    ehReflexaoPessoalOuAprendizado: input.ehReflexaoPessoalOuAprendizado,
  });

  let frameworksDoTema: string[] = [];
  if (input.temaId) {
    const tema = await deps.temaMapeadoRepository.buscarPorId(input.temaId);
    frameworksDoTema = tema?.frameworks.map((f) => f.nome) ?? [];
  }

  return { recomendacao, frameworksDoTema };
}
