"use server";

import { revalidatePath } from "next/cache";
import { registrarDocumentoOficial } from "@/brand_intelligence/application/registrar-documento-oficial";
import { verificarAtualizacaoDoDocumento } from "@/brand_intelligence/application/verificar-atualizacao-do-documento";
import { sincronizarDocumento } from "@/brand_intelligence/application/sincronizar-documento";
import { criarDependenciasDeBrandIntelligence } from "@/brand_intelligence/infrastructure/composicao";
import { logarFalhaEPropagar } from "@infra/logging/logger";

export async function registrarDocumentoAction(formData: FormData) {
  const deps = criarDependenciasDeBrandIntelligence();

  try {
    await registrarDocumentoOficial(
      {
        titulo: String(formData.get("titulo")),
        googleDriveFileId: String(formData.get("googleDriveFileId")),
        tipoDocumento: String(formData.get("tipoDocumento")),
      },
      { documentoOficialRepository: deps.documentoOficialRepository }
    );
  } catch (erro) {
    logarFalhaEPropagar("registrarDocumentoAction", erro);
  }

  revalidatePath("/brand-intelligence");
}

/**
 * "Sincronizar agora" (UI_UX.md, seção 12) — executa as duas etapas
 * da arquitetura em sequência: verifica mudança (marca `desatualizado`
 * se detectada) e, na sequência, sincroniza de fato (chunking +
 * `indexado`). Nenhuma das duas etapas lança exceção para a
 * Presentation — falhas resultam em status `erro`, nunca em página
 * quebrada (ARCHITECTURE.md, seção 18).
 */
export async function sincronizarAgoraAction(formData: FormData) {
  const deps = criarDependenciasDeBrandIntelligence();
  const documentoId = String(formData.get("documentoId"));

  try {
    await verificarAtualizacaoDoDocumento(documentoId, deps);
    await sincronizarDocumento(documentoId, deps);
  } catch (erro) {
    logarFalhaEPropagar("sincronizarAgoraAction", erro);
  }

  revalidatePath("/brand-intelligence");
}
