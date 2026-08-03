import { env } from "@config/env";
import { TIPOS_DESTINO } from "@/shared/enums/tipo-destino";
import type { PortaDeIA, ClassificacaoSugerida } from "@/ia/domain/porta-de-ia";

const PROMPT_VERSION = "inbox-classificacao-v1";
const MODELO_PADRAO = "anthropic/claude-3.5-haiku";

/**
 * Adapter real da Porta de IA via OpenRouter (stack aprovada: "Ports &
 * Adapters — primeira implementação: OpenRouter", ARCHITECTURE.md
 * seção 13). A Application/Domain nunca conhecem este arquivo
 * diretamente — apenas a interface PortaDeIA.
 *
 * Nota de execução: não exercitado contra a API real neste ambiente
 * de desenvolvimento (sandbox sem acesso de rede a openrouter.ai) —
 * ver relatório da Sprint 2. Cobertura de teste via
 * `FakePortaDeIA` (tests/unit), que exercita Domain/Application sem
 * depender da rede.
 */
export class OpenRouterPortaDeIA implements PortaDeIA {
  async classificarRegistroBruto(conteudoTexto: string): Promise<ClassificacaoSugerida> {
    if (!env.OPENROUTER_API_KEY) {
      throw new Error(
        "OPENROUTER_API_KEY não configurada — não é possível classificar via OpenRouter."
      );
    }

    const inicio = Date.now();

    const resposta = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODELO_PADRAO,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(),
          },
          { role: "user", content: conteudoTexto },
        ],
        response_format: { type: "json_object" },
      }),
    });

    const tempoRespostaMs = Date.now() - inicio;

    if (!resposta.ok) {
      throw new Error(`Falha na chamada ao OpenRouter: HTTP ${resposta.status}`);
    }

    const dados = await resposta.json();
    const conteudo = dados.choices?.[0]?.message?.content;
    if (!conteudo) {
      throw new Error("Resposta do OpenRouter sem conteúdo classificável.");
    }

    const parsed = JSON.parse(conteudo) as {
      tipoDestinoSugerido: string;
      justificativa: string;
      confianca: number;
    };

    if (!TIPOS_DESTINO.includes(parsed.tipoDestinoSugerido as (typeof TIPOS_DESTINO)[number])) {
      throw new Error(
        `Tipo de destino sugerido inválido pela IA: ${parsed.tipoDestinoSugerido}`
      );
    }

    return {
      tipoDestinoSugerido: parsed.tipoDestinoSugerido as ClassificacaoSugerida["tipoDestinoSugerido"],
      justificativa: parsed.justificativa,
      confianca: parsed.confianca,
      provider: "openrouter",
      modelo: MODELO_PADRAO,
      promptVersion: PROMPT_VERSION,
      tokensInput: dados.usage?.prompt_tokens ?? 0,
      tokensOutput: dados.usage?.completion_tokens ?? 0,
      custoEstimado: null,
      tempoRespostaMs,
    };
  }
}

function buildSystemPrompt(): string {
  return [
    "Você classifica um registro bruto capturado por Victor Sousa em um dos seguintes tipos de destino:",
    TIPOS_DESTINO.join(", "),
    "Responda APENAS em JSON com os campos: tipoDestinoSugerido, justificativa (curta), confianca (0 a 1).",
  ].join("\n");
}
