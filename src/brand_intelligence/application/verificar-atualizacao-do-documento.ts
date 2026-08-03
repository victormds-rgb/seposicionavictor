import type { DocumentoOficialRepository } from "@/brand_intelligence/domain/brand-intelligence-repository";
import type { PortaDeDrive } from "@/brand_intelligence/domain/porta-de-drive";
import { calcularHash } from "@/brand_intelligence/domain/chunking";
import { houveMudanca, statusAposFalha } from "@/brand_intelligence/domain/documento-oficial";
import { logger } from "@infra/logging/logger";

export class DocumentoNaoEncontradoError extends Error {}

export interface ResultadoVerificacao {
  mudancaDetectada: boolean;
  sucesso: boolean;
}

/**
 * Use Case: verifica se o conteúdo do documento no Google Drive mudou
 * desde a última sincronização (ARCHITECTURE.md, seção 21 — "job de
 * sincronização detecta mudança via hash").
 *
 * NÃO reindexação — apenas marca `desatualizado` quando detecta
 * mudança. A reindexação real é responsabilidade de
 * `sincronizarDocumento` (Use Case separado).
 *
 * Invariante (ARCHITECTURE.md, seção 18): falha na chamada ao Drive
 * NUNCA lança exceção não tratada — sempre resulta em status `erro`,
 * sem bloquear o restante do sistema.
 */
export async function verificarAtualizacaoDoDocumento(
  documentoId: string,
  deps: { documentoOficialRepository: DocumentoOficialRepository; portaDeDrive: PortaDeDrive }
): Promise<ResultadoVerificacao> {
  const documento = await deps.documentoOficialRepository.buscarPorId(documentoId);
  if (!documento) {
    throw new DocumentoNaoEncontradoError(`DocumentoOficial ${documentoId} não encontrado.`);
  }

  try {
    const { conteudoTexto } = await deps.portaDeDrive.buscarConteudo(documento.googleDriveFileId);
    const hashAtual = calcularHash(conteudoTexto);
    const mudou = houveMudanca(documento.hashConteudo, hashAtual);

    if (mudou) {
      await deps.documentoOficialRepository.atualizarStatus(documentoId, "desatualizado");
    }

    return { mudancaDetectada: mudou, sucesso: true };
  } catch (error) {
    logger.warn("Falha ao verificar atualização de Documento Oficial", {
      documentoId,
      erro: error instanceof Error ? error.message : String(error),
    });
    await deps.documentoOficialRepository.atualizarStatus(documentoId, statusAposFalha());
    return { mudancaDetectada: false, sucesso: false };
  }
}
