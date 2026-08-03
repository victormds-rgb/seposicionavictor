import type { Projeto, StatusProjeto, TipoProjeto } from "./projeto";
import type { CriterioDeLancamento, StatusCriterioLancamento } from "./criterio-de-lancamento";

export interface FiltrosProjeto {
  status?: StatusProjeto;
  clienteId?: string;
  tipo?: TipoProjeto;
}

export interface ProjetoRepository {
  criar(projeto: Omit<Projeto, "id">): Promise<Projeto>;
  buscarPorId(id: string): Promise<Projeto | null>;
  atualizarStatus(id: string, status: StatusProjeto): Promise<void>;
  atualizarCamposDeCase(
    id: string,
    campos: Partial<
      Pick<
        Projeto,
        "momentoQuebra" | "solucao" | "tempoDecorrido" | "numeroResultado"
      >
    >
  ): Promise<void>;
  listar(filtros: FiltrosProjeto): Promise<Projeto[]>;

  criarCriterioDeLancamento(
    criterio: Omit<CriterioDeLancamento, "id">
  ): Promise<CriterioDeLancamento>;
  listarCriteriosDeLancamento(projetoId: string): Promise<CriterioDeLancamento[]>;
  atualizarStatusCriterio(
    id: string,
    status: StatusCriterioLancamento,
    dataConfirmacao: Date | null
  ): Promise<void>;
  buscarCriterioPorId(id: string): Promise<CriterioDeLancamento | null>;
}
