import type { Case, StatusCase } from "./case";

export interface CampoDeCaseEditavel {
  desculpa?: string;
  custo?: number;
  momentoQuebra?: string;
  solucao?: string;
  tempo?: string;
  numeroResultado?: string;
  canalEscolhido?: Case["canalEscolhido"];
}

export interface CaseRepository {
  criar(caso: Omit<Case, "id">): Promise<Case>;
  buscarPorId(id: string): Promise<Case | null>;
  buscarPorProjetoId(projetoId: string): Promise<Case[]>;
  atualizarCampos(id: string, campos: CampoDeCaseEditavel): Promise<Case>;
  atualizarStatus(id: string, status: StatusCase): Promise<void>;
  listar(filtros: { status?: StatusCase }): Promise<Case[]>;

  /** Append-only — nunca editado ou apagado (NFR de auditabilidade). */
  registrarHistorico(caseId: string, snapshot: Record<string, unknown>): Promise<void>;
  listarHistorico(caseId: string): Promise<Array<{ snapshot: Record<string, unknown>; alteradoEm: Date }>>;
}
