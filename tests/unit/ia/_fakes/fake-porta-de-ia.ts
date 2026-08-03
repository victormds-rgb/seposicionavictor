import type { PortaDeIA, ClassificacaoSugerida } from "@/ia/domain/porta-de-ia";

export class FakePortaDeIA implements PortaDeIA {
  proximaResposta: ClassificacaoSugerida = {
    tipoDestinoSugerido: "tarefa",
    justificativa: "Parece uma ação de acompanhamento simples.",
    confianca: 0.8,
    provider: "fake",
    modelo: "fake-model",
    promptVersion: "test-v1",
    tokensInput: 10,
    tokensOutput: 5,
    custoEstimado: 0,
    tempoRespostaMs: 1,
  };

  async classificarRegistroBruto(): Promise<ClassificacaoSugerida> {
    return this.proximaResposta;
  }
}
