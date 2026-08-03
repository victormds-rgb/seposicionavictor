import type { Framework } from "./framework";
import type { TipoAtivoConhecimento, AtivoDeConhecimento } from "./ativo-de-conhecimento";
import type { RegraDeDecisao } from "./regra-de-decisao";

export interface FrameworkRepository {
  listar(): Promise<Framework[]>;
  buscarPorNome(nome: string): Promise<Framework | null>;
  buscarPorId(id: string): Promise<Framework | null>;
}

export interface TemaMapeadoRepository {
  listar(): Promise<Array<{ id: string; nomeTema: string; frameworks: Framework[] }>>;
  buscarPorId(id: string): Promise<{ id: string; nomeTema: string; frameworks: Framework[] } | null>;
}

export interface AtivoDeConhecimentoRepository {
  listar(filtros: { tipo?: TipoAtivoConhecimento }): Promise<AtivoDeConhecimento[]>;
  criar(ativo: Omit<AtivoDeConhecimento, "id">): Promise<AtivoDeConhecimento>;
  incrementarFrequenciaUso(id: string): Promise<void>;
}

export interface RegraDeDecisaoRepository {
  listar(): Promise<RegraDeDecisao[]>;
  buscarPorAplicacao(aplicaA: RegraDeDecisao["aplicaA"]): Promise<RegraDeDecisao | null>;
}
