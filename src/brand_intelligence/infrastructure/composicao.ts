import {
  DrizzleDocumentoOficialRepository,
  DrizzleDocumentoChunkRepository,
} from "@/brand_intelligence/infrastructure/brand-intelligence-repository";
import { GoogleDrivePortaDeDrive } from "@/brand_intelligence/infrastructure/providers/google-drive-provider";

export function criarDependenciasDeBrandIntelligence() {
  return {
    documentoOficialRepository: new DrizzleDocumentoOficialRepository(),
    documentoChunkRepository: new DrizzleDocumentoChunkRepository(),
    portaDeDrive: new GoogleDrivePortaDeDrive(),
  };
}
