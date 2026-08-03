import type { DocumentoOficial, StatusIndexacao, TipoDocumento } from "./documento-oficial";

export interface DocumentoOficialRepository {
  criar(documento: Omit<DocumentoOficial, "id">): Promise<DocumentoOficial>;
  buscarPorId(id: string): Promise<DocumentoOficial | null>;
  buscarPorGoogleDriveFileId(googleDriveFileId: string): Promise<DocumentoOficial | null>;
  atualizarStatus(id: string, status: StatusIndexacao): Promise<void>;
  atualizarAposSincronizacao(
    id: string,
    input: { hashConteudo: string; statusIndexacao: StatusIndexacao; ultimaSincronizacao: Date }
  ): Promise<void>;
  listar(filtros: { tipoDocumento?: TipoDocumento }): Promise<DocumentoOficial[]>;
}

export interface ChunkArmazenado {
  id: string;
  documentoId: string;
  conteudoChunk: string;
  ordem: number;
}

export interface DocumentoChunkRepository {
  substituirChunks(documentoId: string, chunks: string[]): Promise<ChunkArmazenado[]>;
  listarPorDocumento(documentoId: string): Promise<ChunkArmazenado[]>;
  buscarPorTexto(consulta: string, limite: number): Promise<ChunkArmazenado[]>;
}
