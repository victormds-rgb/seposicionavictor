import type { TipoDestino } from "@/shared/enums/tipo-destino";

/**
 * Porta de IA — abstração que permite substituir o provider de IA
 * sem alterar Domain ou Application (stack aprovada: "Ports & Adapters
 * ... primeira implementação: OpenRouter"; ARCHITECTURE.md, seção 13).
 */
export interface ClassificacaoSugerida {
  tipoDestinoSugerido: TipoDestino;
  justificativa: string;
  confianca: number;
  provider: string;
  modelo: string;
  promptVersion: string;
  tokensInput: number;
  tokensOutput: number;
  custoEstimado: number | null;
  tempoRespostaMs: number;
}

export interface PortaDeIA {
  classificarRegistroBruto(conteudoTexto: string): Promise<ClassificacaoSugerida>;
}
