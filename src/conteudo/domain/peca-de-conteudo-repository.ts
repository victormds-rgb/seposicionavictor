import type { PecaDeConteudo, StatusConteudo } from "./peca-de-conteudo";

export interface FiltrosPecaDeConteudo {
  status?: StatusConteudo;
  pilarId?: string;
  publicadasDesde?: Date;
}

export interface PecaDeConteudoRepository {
  criar(peca: Omit<PecaDeConteudo, "id">): Promise<PecaDeConteudo>;
  buscarPorId(id: string): Promise<PecaDeConteudo | null>;
  atualizarStatus(id: string, status: StatusConteudo, dataPublicacao?: Date): Promise<void>;
  listar(filtros: FiltrosPecaDeConteudo): Promise<PecaDeConteudo[]>;
  contarPublicadasPorPilar(publicadasDesde?: Date): Promise<Array<{ pilarId: string; total: number }>>;
  listarUltimasPublicadas(limite: number): Promise<PecaDeConteudo[]>;
}

export interface PilarRepository {
  listar(): Promise<Array<{ id: string; nome: string; pesoAlvoPercentual: number }>>;
  buscarPorId(id: string): Promise<{ id: string; nome: string; pesoAlvoPercentual: number } | null>;
}

export interface SerieFixaRepository {
  listar(): Promise<Array<{ id: string; nome: string }>>;
}
