import type {
  DocumentoOficialRepository,
  DocumentoChunkRepository,
} from "@/brand_intelligence/domain/brand-intelligence-repository";

/**
 * `ConsultorDeBrandIntelligence` (ARCHITECTURE.md, seções 7 e 21):
 * "injeta contexto em qualquer prompt que gere conteúdo, proposta, ou
 * resposta comercial." Nesta Sprint, expõe a capacidade de busca —
 * a integração com os Domain Services de IA (Sprint 9) consome esta
 * função, ainda não o contrário.
 *
 * Busca textual simples (ILIKE) nesta versão — não há pipeline de
 * embeddings/busca semântica real ainda; `embeddingRef` no schema
 * permanece reservado para uma futura substituição sem alterar a
 * assinatura desta função (Ports & Adapters).
 */
export async function buscarContextoRelevante(
  consulta: string,
  deps: { documentoChunkRepository: DocumentoChunkRepository },
  limite = 5
) {
  return deps.documentoChunkRepository.buscarPorTexto(consulta, limite);
}

export async function listarDocumentosOficiais(
  filtros: { tipoDocumento?: string },
  deps: { documentoOficialRepository: DocumentoOficialRepository }
) {
  return deps.documentoOficialRepository.listar(filtros as never);
}

export async function listarChunksDoDocumento(
  documentoId: string,
  deps: { documentoChunkRepository: DocumentoChunkRepository }
) {
  return deps.documentoChunkRepository.listarPorDocumento(documentoId);
}
