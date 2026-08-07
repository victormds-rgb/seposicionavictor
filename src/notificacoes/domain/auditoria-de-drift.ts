/**
 * Domínio da AuditoriaDeDrift (Bounded Context Notificações) —
 * DOMAIN_MODEL.md, SOM Cap. 8.2.
 */

export const STATUS_AUDITORIA = ["agendada", "em_execucao", "concluida"] as const;
export type StatusAuditoria = (typeof STATUS_AUDITORIA)[number];

export interface AuditoriaDeDrift {
  id: string;
  dataExecucao: Date;
  pecasAvaliadas: string[];
  percentualFalha: number | null;
  recomendacaoGerada: string | null;
  status: StatusAuditoria;
}

export const LIMIAR_FALHA_PERCENTUAL = 30;

export interface PecaParaAuditoria {
  id: string;
  conteudoTexto: string | null;
  origemTipo: "case" | "build_log" | "autonomo";
  temaId: string | null;
  frameworkId: string | null;
}

/**
 * Checklist automatizável (proxy) contra o SOM Cap. 1.8 e 2.7.
 *
 * NOTA DE CONFORMIDADE (Sprint 9): os checklists originais do SOM
 * (Cap. 1.8 — "o que a marca não é"; Cap. 2.7 — "o que evitar") são,
 * em boa parte, julgamentos qualitativos (ex: "soa como algo que só
 * eu diria?") que exigem leitura humana, não são inteiramente
 * automatizáveis a partir de dados estruturados. Esta função
 * implementa um SUBCONJUNTO verificável objetivamente a partir do que
 * já está armazenado — não substitui a revisão humana, apenas sinaliza
 * candidatos a revisão (SOM Cap. 8.2: "revisar contra o checklist",
 * nunca "aprovar automaticamente").
 *
 * Verificações automatizadas:
 * 1. Repetição literal da frase-âncora no corpo do texto (Cap. 2.7:
 *    "repetir a frase-âncora... vira jargão vazio").
 * 2. Peça autônoma sem tema nem framework associado (não seguiu nem
 *    Prova/Portfólio nem a árvore do Cap. 2.6 de forma identificável).
 */
/**
 * Sprint 23B, item 3 (DOGFOODING_REPORT.md): extraídas como funções
 * nomeadas — mesmas duas condições de sempre, comportamento de
 * `falhouChecklistAutomatizavel` idêntico — só para permitir que o
 * Use Case diga QUAL critério reprovou cada peça, em vez de expor só
 * um booleano. Necessário para a mensagem de diagnóstico não induzir
 * a uma causa que não é a real.
 */
export function repetiuFraseAncora(peca: PecaParaAuditoria, fraseAncora: string): boolean {
  return !!peca.conteudoTexto?.includes(fraseAncora);
}

export function semLenteReconhecivel(peca: PecaParaAuditoria): boolean {
  return peca.origemTipo === "autonomo" && !peca.temaId && !peca.frameworkId;
}

export function falhouChecklistAutomatizavel(
  peca: PecaParaAuditoria,
  fraseAncora: string
): boolean {
  return repetiuFraseAncora(peca, fraseAncora) || semLenteReconhecivel(peca);
}

export function calcularPercentualFalha(totalFalhas: number, totalAvaliadas: number): number {
  if (totalAvaliadas === 0) return 0;
  return Math.round((totalFalhas / totalAvaliadas) * 10000) / 100;
}

export function ultrapassouLimiar(percentualFalha: number): boolean {
  return percentualFalha > LIMIAR_FALHA_PERCENTUAL;
}

/**
 * Gera o texto de recomendação — NUNCA uma ação automática sobre o
 * Fundamento (SOM Cap. 8.3; ADR análogo ao já aplicado a
 * AuditoriaDeDrift em DOMAIN_MODEL.md: "nunca altera o Fundamento
 * diretamente").
 */
export function gerarRecomendacao(percentualFalha: number): string | null {
  if (!ultrapassouLimiar(percentualFalha)) return null;
  return `${percentualFalha}% dos últimos conteúdos avaliados falharam no checklist automatizável — recomenda-se pausar produção nova e revisar o Fundamento (SOM Cap. 8.2). Esta é uma recomendação; nenhuma ação automática foi tomada.`;
}
