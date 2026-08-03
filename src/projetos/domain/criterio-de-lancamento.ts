/**
 * CriterioDeLancamento — entidade interna do agregado Projeto
 * (SOM Cap. 7.2: "só lançar publicamente uma feature quando ela
 * gerar 'ficou muito bom, vai me ajudar'").
 */

export const STATUS_CRITERIO_LANCAMENTO = ["pendente", "satisfeito"] as const;
export type StatusCriterioLancamento = (typeof STATUS_CRITERIO_LANCAMENTO)[number];

export interface CriterioDeLancamento {
  id: string;
  projetoId: string;
  descricaoFeature: string;
  status: StatusCriterioLancamento;
  dataConfirmacao: Date | null;
}

/**
 * Invariante (SOM Cap. 7.2): só satisfeito por confirmação humana
 * explícita — julgamento subjetivo de qualidade, nunca inferido
 * automaticamente por IA (ADR-005).
 */
export function podeSerSatisfeito(criterio: Pick<CriterioDeLancamento, "status">): boolean {
  return criterio.status === "pendente";
}
