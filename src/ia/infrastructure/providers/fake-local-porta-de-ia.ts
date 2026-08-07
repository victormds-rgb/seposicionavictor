import type { PortaDeIA, ClassificacaoSugerida } from "@/ia/domain/porta-de-ia";

/**
 * Adapter fake da Porta de IA — Sprint 12 (Produção/Operação).
 *
 * Existe exclusivamente para permitir rodar a Inbox localmente e nos
 * testes E2E (tests/e2e/inbox, tests/e2e/agenda) sem uma chave real
 * da OpenAI. Determinístico, sem custo, sem rede.
 *
 * NUNCA usado em produção: a seleção deste adapter em vez de
 * `OpenAIPortaDeIA` é decidida em
 * `src/inbox/infrastructure/composicao.ts`, que só instancia esta
 * classe quando `NODE_ENV !== "production"` E `OPENAI_API_KEY` está
 * ausente — em produção, a ausência da chave continua lançando o
 * mesmo erro de sempre (`OpenAIPortaDeIA`), comportamento inalterado.
 */
export class FakeLocalPortaDeIA implements PortaDeIA {
  async classificarRegistroBruto(conteudoTexto: string): Promise<ClassificacaoSugerida> {
    const resumo = conteudoTexto.length > 60 ? `${conteudoTexto.slice(0, 60)}...` : conteudoTexto;

    return {
      tipoDestinoSugerido: "tarefa",
      justificativa: `[modo fake — OPENAI_API_KEY não configurada] Classificação simulada para: "${resumo}".`,
      confianca: 0.5,
      provider: "fake-local",
      modelo: "fake-local-v1",
      promptVersion: "fake-v1",
      tokensInput: 0,
      tokensOutput: 0,
      custoEstimado: 0,
      tempoRespostaMs: 1,
    };
  }
}
