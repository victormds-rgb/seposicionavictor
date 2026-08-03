import type { SugestaoIA, StatusSugestao } from "./sugestao-ia";

export interface SugestaoIARepository {
  criar(sugestao: Omit<SugestaoIA, "id">): Promise<SugestaoIA>;
  buscarPorId(id: string): Promise<SugestaoIA | null>;
  atualizarStatus(
    id: string,
    status: StatusSugestao,
    conteudoSugeridoFinal?: Record<string, unknown>
  ): Promise<void>;
  buscarPendentePorRegistroOrigem(entidadeOrigemId: string): Promise<SugestaoIA | null>;
  buscarMaisRecentePorRegistroOrigem(entidadeOrigemId: string): Promise<SugestaoIA | null>;
}
