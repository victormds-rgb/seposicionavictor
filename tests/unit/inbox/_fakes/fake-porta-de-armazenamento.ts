import type {
  PortaDeArmazenamentoBinario,
  ArquivoParaArmazenar,
  ResultadoArmazenamento,
} from "@/inbox/domain/porta-de-armazenamento-binario";

export class FakePortaDeArmazenamentoBinario implements PortaDeArmazenamentoBinario {
  arquivosArmazenados: ArquivoParaArmazenar[] = [];

  async armazenar(arquivo: ArquivoParaArmazenar): Promise<ResultadoArmazenamento> {
    this.arquivosArmazenados.push(arquivo);
    return { referencia: `fake/${arquivo.nomeOriginal}` };
  }
}
