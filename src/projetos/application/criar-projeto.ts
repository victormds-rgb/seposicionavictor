import { z } from "zod";
import type { ProjetoRepository } from "@/projetos/domain/projeto-repository";
import { TIPOS_PROJETO, criacaoValida } from "@/projetos/domain/projeto";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class CriacaoInvalidaError extends Error {}

const criarProjetoSchema = z.object({
  nome: z.string().trim().min(1),
  tipo: z.enum(TIPOS_PROJETO),
  clienteId: z.string().uuid().optional(),
  desculpaInicial: z.string().trim().optional(),
  custoMensal: z.number().optional(),
});

export type CriarProjetoInput = z.infer<typeof criarProjetoSchema>;

/**
 * Use Case: criar um Projeto.
 *
 * Invariante (SOM Cap. 5.3): "desde o dia 1, registrar a desculpa
 * inicial e o custo mensal do problema" — validado ANTES da criação
 * via `criacaoValida`, nunca corrigido depois.
 */
export async function criarProjeto(
  inputBruto: unknown,
  deps: { projetoRepository: ProjetoRepository; eventPublisher?: IEventPublisher }
) {
  const input = criarProjetoSchema.parse(inputBruto);

  if (
    !criacaoValida({
      tipo: input.tipo,
      desculpaInicial: input.desculpaInicial ?? null,
      custoMensal: input.custoMensal ?? null,
      clienteId: input.clienteId ?? null,
    })
  ) {
    throw new CriacaoInvalidaError(
      "Projeto de cliente externo não pode ser criado sem desculpa inicial e custo mensal."
    );
  }

  const projeto = await deps.projetoRepository.criar({
    nome: input.nome,
    tipo: input.tipo,
    clienteId: input.clienteId ?? null,
    desculpaInicial: input.desculpaInicial ?? null,
    custoMensal: input.custoMensal ?? null,
    momentoQuebra: null,
    solucao: null,
    tempoDecorrido: null,
    numeroResultado: null,
    status: "iniciado",
    metadata: null,
  });

  await deps.eventPublisher?.publicar({
    aggregate: "projeto",
    aggregateId: projeto.id,
    eventName: "projeto.iniciado",
    payload: { tipo: projeto.tipo, clienteId: projeto.clienteId },
    actorTipo: "humano",
    source: "projetos.criar_projeto",
  });

  return projeto;
}
