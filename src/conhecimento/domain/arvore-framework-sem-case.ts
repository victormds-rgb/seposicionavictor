/**
 * RegraDeDecisao "Framework sem Case" (SOM, Cap. 2.6):
 *
 * ```
 * Tenho case pessoal ou de cliente sobre o assunto?
 * ├── SIM → use Prova e Portfólio (Capítulo 5)
 * └── NÃO → é tendência/notícia/tema de terceiros?
 *     ├── SIM → aplique Framework 1 ou 2 como lente crítica
 *     └── NÃO → é reflexão pessoal/aprendizado em andamento?
 *         ├── SIM → use Quebra-Recuo-Volta ou Perguntas Recorrentes
 *         └── NÃO → não publique ainda — falta ângulo próprio
 * ```
 *
 * Critério de Aceite da Sprint 7 (IMPLEMENTATION_PLAN.md): "Uma Peça
 * de Conteúdo sem Case associado pode ser criada seguindo a árvore de
 * decisão do Cap. 2.6."
 */

export const RECOMENDACOES_SEM_CASE = [
  "usar_prova_e_portfolio",
  "aplicar_framework_critico",
  "usar_quebra_recuo_volta_ou_perguntas",
  "nao_publicar_ainda",
] as const;
export type RecomendacaoSemCase = (typeof RECOMENDACOES_SEM_CASE)[number];

export interface RespostasArvoreSemCase {
  temCasoPessoalOuDeCliente: boolean;
  ehTendenciaOuNoticiaDeTerceiros: boolean;
  ehReflexaoPessoalOuAprendizado: boolean;
}

export function avaliarPecaSemCase(respostas: RespostasArvoreSemCase): RecomendacaoSemCase {
  if (respostas.temCasoPessoalOuDeCliente) return "usar_prova_e_portfolio";
  if (respostas.ehTendenciaOuNoticiaDeTerceiros) return "aplicar_framework_critico";
  if (respostas.ehReflexaoPessoalOuAprendizado) return "usar_quebra_recuo_volta_ou_perguntas";
  return "nao_publicar_ainda";
}
