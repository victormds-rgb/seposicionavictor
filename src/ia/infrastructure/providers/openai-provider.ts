import OpenAI from "openai";
import { env } from "@config/env";
import { TIPOS_DESTINO } from "@/shared/enums/tipo-destino";
import type { PortaDeIA, ClassificacaoSugerida } from "@/ia/domain/porta-de-ia";

const PROMPT_VERSION = "inbox-classificacao-v1";
const MODELO_PADRAO = "gpt-5.5";

/**
 * Adapter real da Porta de IA via API oficial da OpenAI (Sprint 31A —
 * único provedor de IA do projeto, substitui o adapter OpenRouter).
 * A Application/Domain nunca conhecem este arquivo diretamente —
 * apenas a interface `PortaDeIA` (`src/ia/domain/porta-de-ia.ts`),
 * que não mudou.
 */
export class OpenAIPortaDeIA implements PortaDeIA {
  async classificarRegistroBruto(conteudoTexto: string): Promise<ClassificacaoSugerida> {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY não configurada — não é possível classificar via OpenAI.");
    }

    const modelo = env.OPENAI_MODEL ?? MODELO_PADRAO;
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const inicio = Date.now();

    const completion = await client.chat.completions.create({
      model: modelo,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: conteudoTexto },
      ],
      response_format: { type: "json_object" },
    });

    const tempoRespostaMs = Date.now() - inicio;

    const conteudo = completion.choices[0]?.message?.content;
    if (!conteudo) {
      throw new Error("Resposta da OpenAI sem conteúdo classificável.");
    }

    const parsed = JSON.parse(conteudo) as {
      tipoDestinoSugerido: string;
      justificativa: string;
      confianca: number;
    };

    if (!TIPOS_DESTINO.includes(parsed.tipoDestinoSugerido as (typeof TIPOS_DESTINO)[number])) {
      throw new Error(`Tipo de destino sugerido inválido pela IA: ${parsed.tipoDestinoSugerido}`);
    }

    return {
      tipoDestinoSugerido: parsed.tipoDestinoSugerido as ClassificacaoSugerida["tipoDestinoSugerido"],
      justificativa: parsed.justificativa,
      confianca: parsed.confianca,
      provider: "openai",
      modelo,
      promptVersion: PROMPT_VERSION,
      tokensInput: completion.usage?.prompt_tokens ?? 0,
      tokensOutput: completion.usage?.completion_tokens ?? 0,
      // Sem tabela de preço por modelo mantida no código (evita custo
      // estimado errado sempre que a OpenAI reprecificar) — mesmo
      // comportamento do adapter anterior. Ver relatório da Sprint 31A.
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
