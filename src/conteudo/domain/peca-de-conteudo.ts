import type { Canal } from "@/shared/enums/canal";

/**
 * Domínio da PecaDeConteudo (Bounded Context Conteúdo) —
 * DOMAIN_MODEL.md, SOM Cap. 2, 3, 9.
 */

export const ORIGENS_CONTEUDO = ["case", "build_log", "autonomo"] as const;
export type OrigemConteudo = (typeof ORIGENS_CONTEUDO)[number];

export const STATUS_CONTEUDO = ["rascunho", "em_revisao", "agendado", "publicado"] as const;
export type StatusConteudo = (typeof STATUS_CONTEUDO)[number];

export interface PecaDeConteudo {
  id: string;
  temaId: string | null;
  frameworkId: string | null;
  canal: Canal;
  serieFixaId: string | null;
  pilarId: string;
  status: StatusConteudo;
  origemTipo: OrigemConteudo;
  origemCaseId: string | null;
  origemBuildLogId: string | null;
  pecaOrigemId: string | null;
  conteudoTexto: string | null;
  dataPublicacao: Date | null;
  metadata: Record<string, unknown> | null;
}

/**
 * "Comprimento" de cada canal — proxy de formato usado para validar a
 * derivação unidirecional (SOM Cap. 9.8; DATABASE.md, restrição da
 * PecaDeConteudo: "newsletter/vídeo são sempre 'longos', X é sempre
 * 'curto'"). DECISÃO DE ENGENHARIA DESTA SPRINT: o DATABASE.md dava
 * apenas 2 exemplos (newsletter/youtube = longo, x = curto) sem
 * posicionar linkedin/instagram explicitamente — completado aqui como
 * uma escala ordinal de 3 níveis, preenchendo a lacuna sem
 * contradizer os exemplos já dados.
 */
const COMPRIMENTO_DO_CANAL: Record<Canal, number> = {
  newsletter: 3,
  youtube: 3,
  linkedin: 2,
  instagram: 2,
  x: 1,
};

export function comprimentoDoCanal(canal: Canal): number {
  return COMPRIMENTO_DO_CANAL[canal];
}

/**
 * Invariante (SOM Cap. 9.8, DOMAIN_MODEL.md): "Nunca existe derivação
 * onde a origem é mais curta que a derivada." A derivação só é válida
 * quando o canal de origem é estritamente mais longo que o da peça
 * derivada — nunca igual, nunca mais curto.
 */
export function derivacaoValida(canalOrigem: Canal, canalDerivada: Canal): boolean {
  return comprimentoDoCanal(canalOrigem) > comprimentoDoCanal(canalDerivada);
}

/** Invariante: toda peça publicada tem Pilar atribuído — reforço de domínio (pilarId já é NOT NULL no schema). */
export function podePublicar(peca: Pick<PecaDeConteudo, "status" | "pilarId">): boolean {
  return (peca.status === "rascunho" || peca.status === "em_revisao" || peca.status === "agendado") && !!peca.pilarId;
}
