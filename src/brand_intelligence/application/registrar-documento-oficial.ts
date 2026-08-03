import { z } from "zod";
import type { DocumentoOficialRepository } from "@/brand_intelligence/domain/brand-intelligence-repository";
import { TIPOS_DOCUMENTO } from "@/brand_intelligence/domain/documento-oficial";

export class DocumentoJaCadastradoError extends Error {}

const registrarDocumentoSchema = z.object({
  titulo: z.string().trim().min(1),
  googleDriveFileId: z.string().trim().min(1),
  tipoDocumento: z.enum(TIPOS_DOCUMENTO),
});

export type RegistrarDocumentoInput = z.infer<typeof registrarDocumentoSchema>;

/**
 * Use Case: cadastrar um novo Documento Oficial — apenas a referência
 * ao arquivo no Google Drive (fonte oficial, ADR-004). A indexação em
 * si é feita por `sincronizarDocumento`, nunca automaticamente aqui.
 */
export async function registrarDocumentoOficial(
  inputBruto: unknown,
  deps: { documentoOficialRepository: DocumentoOficialRepository }
) {
  const input = registrarDocumentoSchema.parse(inputBruto);

  const existente = await deps.documentoOficialRepository.buscarPorGoogleDriveFileId(
    input.googleDriveFileId
  );
  if (existente) {
    throw new DocumentoJaCadastradoError(
      `Já existe um Documento Oficial para o arquivo do Drive ${input.googleDriveFileId}.`
    );
  }

  return deps.documentoOficialRepository.criar({
    titulo: input.titulo,
    googleDriveFileId: input.googleDriveFileId,
    tipoDocumento: input.tipoDocumento,
    ultimaSincronizacao: null,
    hashConteudo: null,
    statusIndexacao: "nao_indexado",
    metadata: null,
  });
}
