import type {
  DocumentoOficialRepository,
  DocumentoChunkRepository,
} from "@/brand_intelligence/domain/brand-intelligence-repository";
import type { PortaDeDrive } from "@/brand_intelligence/domain/porta-de-drive";
import { calcularHash, dividirEmChunks } from "@/brand_intelligence/domain/chunking";
import { statusAposFalha } from "@/brand_intelligence/domain/documento-oficial";
import { logger } from "@infra/logging/logger";

export class DocumentoNaoEncontradoError extends Error {}

export interface ResultadoSincronizacao {
  sucesso: boolean;
  totalChunks: number;
}

/**
 * Use Case: sincronização completa — busca o conteúdo real no Drive,
 * divide em chunks, substitui os chunks anteriores (sempre
 * recriáveis a partir da fonte oficial, ADR-004) e marca `indexado`.
 *
 * Nota de execução: não exercitado contra a API real do Google Drive
 * neste ambiente de desenvolvimento (sandbox sem acesso de rede a
 * googleapis.com) — ver relatório da Sprint 8. Cobertura de
 * comportamento via `FakePortaDeDrive` (tests/unit), incluindo o
 * caminho de falha.
 *
 * Invariante (ARCHITECTURE.md, seção 18): falha nunca bloqueia o
 * restante do sistema — resulta em status `erro`, nunca lança exceção
 * não tratada para o chamador.
 */
export async function sincronizarDocumento(
  documentoId: string,
  deps: {
    documentoOficialRepository: DocumentoOficialRepository;
    documentoChunkRepository: DocumentoChunkRepository;
    portaDeDrive: PortaDeDrive;
  }
): Promise<ResultadoSincronizacao> {
  const documento = await deps.documentoOficialRepository.buscarPorId(documentoId);
  if (!documento) {
    throw new DocumentoNaoEncontradoError(`DocumentoOficial ${documentoId} não encontrado.`);
  }

  try {
    const { conteudoTexto } = await deps.portaDeDrive.buscarConteudo(documento.googleDriveFileId);
    const hashAtual = calcularHash(conteudoTexto);
    const chunks = dividirEmChunks(conteudoTexto);

    await deps.documentoChunkRepository.substituirChunks(documentoId, chunks);

    await deps.documentoOficialRepository.atualizarAposSincronizacao(documentoId, {
      hashConteudo: hashAtual,
      statusIndexacao: "indexado",
      ultimaSincronizacao: new Date(),
    });

    return { sucesso: true, totalChunks: chunks.length };
  } catch (error) {
    logger.warn("Falha ao sincronizar Documento Oficial", {
      documentoId,
      erro: error instanceof Error ? error.message : String(error),
    });
    await deps.documentoOficialRepository.atualizarStatus(documentoId, statusAposFalha());
    return { sucesso: false, totalChunks: 0 };
  }
}
