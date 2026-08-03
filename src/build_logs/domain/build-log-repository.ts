import type { BuildLog, StatusBuildLog } from "./build-log";

export interface BuildLogRepository {
  criar(log: Omit<BuildLog, "id">): Promise<BuildLog>;
  buscarPorId(id: string): Promise<BuildLog | null>;
  atualizarCampos(
    id: string,
    campos: Partial<Pick<BuildLog, "contexto" | "quebra" | "decisao" | "proximoPasso">>
  ): Promise<void>;
  publicar(id: string, dataPublicacao: Date): Promise<void>;
  listarPorProjeto(projetoId: string): Promise<BuildLog[]>;
  buscarUltimoPublicado(projetoId: string): Promise<BuildLog | null>;
  listar(filtros: { status?: StatusBuildLog }): Promise<BuildLog[]>;
}
