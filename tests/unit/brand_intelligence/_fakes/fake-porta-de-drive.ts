import type { PortaDeDrive, ConteudoDeArquivoDrive } from "@/brand_intelligence/domain/porta-de-drive";
import { FalhaDeSincronizacaoError } from "@/brand_intelligence/domain/porta-de-drive";

export class FakePortaDeDrive implements PortaDeDrive {
  proximoConteudo: string = "Conteúdo padrão de teste.";
  deveFalhar = false;

  async buscarConteudo(): Promise<ConteudoDeArquivoDrive> {
    if (this.deveFalhar) {
      throw new FalhaDeSincronizacaoError("Falha simulada de rede/API do Google Drive.");
    }
    return { conteudoTexto: this.proximoConteudo };
  }
}
