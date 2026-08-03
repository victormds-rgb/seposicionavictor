export const TIPOS_SUGESTAO = [
  "classificacao",
  "framework",
  "canal",
  "rascunho",
  "qualificacao_lead",
] as const;
export type TipoSugestao = (typeof TIPOS_SUGESTAO)[number];

export const STATUS_SUGESTAO = [
  "pendente",
  "aceita",
  "rejeitada",
  "editada_e_aceita",
] as const;
export type StatusSugestao = (typeof STATUS_SUGESTAO)[number];

export const ORIGENS_DA_SUGESTAO = [
  "domain_service",
  "agente_comercial",
  "brand_intelligence",
] as const;
export type OrigemDaSugestao = (typeof ORIGENS_DA_SUGESTAO)[number];

export interface SugestaoIA {
  id: string;
  tipoSugestao: TipoSugestao;
  entidadeOrigemTipo: string;
  entidadeOrigemId: string;
  entidadeAlvoTipo: string | null;
  entidadeAlvoId: string | null;
  conteudoSugerido: Record<string, unknown>;
  provider: string | null;
  modelo: string | null;
  promptVersion: string | null;
  temperatura: number | null;
  tokensInput: number | null;
  tokensOutput: number | null;
  custoEstimado: number | null;
  tempoRespostaMs: number | null;
  confianca: number | null;
  origemDaSugestao: OrigemDaSugestao | null;
  status: StatusSugestao;
}

/**
 * Invariante (DOMAIN_MODEL.md): "Nunca transiciona sozinha para
 * 'aceita' sem ação humana correspondente." Esta função apenas
 * valida a transição — quem a invoca é sempre um Use Case disparado
 * por ação humana (nunca o ClassificadorDeRegistroBruto).
 */
export function podeTransicionar(statusAtual: StatusSugestao, novoStatus: StatusSugestao): boolean {
  if (statusAtual !== "pendente") return false;
  return novoStatus === "aceita" || novoStatus === "rejeitada" || novoStatus === "editada_e_aceita";
}
