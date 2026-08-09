/**
 * Domínio do Projeto (Bounded Context Projetos) — DOMAIN_MODEL.md,
 * SOM Cap. 5.3, 7.2.
 */

export const TIPOS_PROJETO = ["cliente_externo", "produto_proprio"] as const;
export type TipoProjeto = (typeof TIPOS_PROJETO)[number];

export const STATUS_PROJETO = ["iniciado", "em_andamento", "pronto_para_case", "encerrado"] as const;
export type StatusProjeto = (typeof STATUS_PROJETO)[number];

export interface Projeto {
  id: string;
  nome: string;
  tipo: TipoProjeto;
  clienteId: string | null;
  desculpaInicial: string | null;
  custoMensal: number | null;
  momentoQuebra: string | null;
  solucao: string | null;
  tempoDecorrido: string | null;
  numeroResultado: string | null;
  status: StatusProjeto;
  metadata: Record<string, unknown> | null;
  // Sprint 39 (Memória Executiva REAL do MeuCMO — Dashboard): única
  // exceção no domínio a um timestamp técnico genérico, e só porque a
  // Sprint pediu explicitamente uma forma de saber se um Projeto
  // pronto_para_case surgiu depois da última visita ao Dashboard —
  // sem isto não há como distinguir "projeto novo" de "projeto antigo
  // que já estava pronto". Nenhuma regra de negócio lê este campo,
  // só a apresentação (src/app/(shell)/dashboard/memoria-executiva.ts).
  criadoEm: Date;
}

/**
 * Invariante (SOM Cap. 5.3, DOMAIN_MODEL.md): "Projeto do tipo
 * cliente_externo nunca existe sem desculpa_inicial e custo_mensal
 * preenchidos desde a criação." Validado ANTES da criação, não depois.
 */
export function criacaoValida(input: {
  tipo: TipoProjeto;
  desculpaInicial: string | null;
  custoMensal: number | null;
  clienteId: string | null;
}): boolean {
  if (input.tipo === "cliente_externo") {
    return (
      !!input.clienteId &&
      !!input.desculpaInicial &&
      input.desculpaInicial.trim().length > 0 &&
      input.custoMensal !== null
    );
  }
  return true;
}

/** Os 6 campos do formato de case (SOM, Cap. 5.1), usados tanto aqui quanto em Case. */
export function camposDeCaseCompletos(projeto: {
  desculpaInicial: string | null;
  custoMensal: number | null;
  momentoQuebra: string | null;
  solucao: string | null;
  tempoDecorrido: string | null;
  numeroResultado: string | null;
}): boolean {
  return (
    !!projeto.desculpaInicial?.trim() &&
    projeto.custoMensal !== null &&
    !!projeto.momentoQuebra?.trim() &&
    !!projeto.solucao?.trim() &&
    !!projeto.tempoDecorrido?.trim() &&
    !!projeto.numeroResultado?.trim()
  );
}

/**
 * Invariante: só transiciona para `pronto_para_case` quando os 6
 * campos do formato de case estão preenchidos (DATABASE.md — ciclo de
 * vida do Projeto).
 */
export function podeTransicionarParaProntoParaCase(projeto: {
  status: StatusProjeto;
  desculpaInicial: string | null;
  custoMensal: number | null;
  momentoQuebra: string | null;
  solucao: string | null;
  tempoDecorrido: string | null;
  numeroResultado: string | null;
}): boolean {
  return (
    (projeto.status === "iniciado" || projeto.status === "em_andamento") &&
    camposDeCaseCompletos(projeto)
  );
}

export function podeSerEncerrado(projeto: Pick<Projeto, "status">): boolean {
  return projeto.status !== "encerrado";
}
