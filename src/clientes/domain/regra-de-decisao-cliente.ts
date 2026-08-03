/**
 * RegraDeDecisao "Aceitar ou Recusar Cliente" (SOM, Cap. 7.1;
 * DOMAIN_MODEL.md, entidade RegraDeDecisao; UI_UX.md, seção 7 —
 * "árvore de decisão apresentada como fluxo guiado").
 *
 * Árvore original:
 * ```
 * Cliente tem autoridade/competência real no próprio setor?
 * ├── SIM → próxima pergunta
 * └── NÃO → aceitar apenas se o caixa exigir, sinalizado como "cliente de caixa"
 *
 * Cliente aceita ouvir diagnóstico antes de exigir execução imediata?
 * ├── SIM → aceitar, prioridade alta
 * └── NÃO → aceitar só se necessário para caixa, com atrito esperado
 *
 * Existe sinal de não cumprimento de combinado (histórico/indicação)?
 * ├── SIM → exigir contrato formal e pagamento adiantado
 * └── NÃO → processo padrão
 * ```
 */

export const CLASSIFICACOES_CLIENTE = [
  "prioridade_alta",
  "cliente_de_caixa",
  "exigir_contrato_reforcado",
] as const;
export type ClassificacaoCliente = (typeof CLASSIFICACOES_CLIENTE)[number];

export interface RespostasArvoreDecisaoCliente {
  temAutoridadeReal: boolean;
  aceitaDiagnostico: boolean;
  sinalNaoCumprimento: boolean;
}

export function avaliarCliente(respostas: RespostasArvoreDecisaoCliente): ClassificacaoCliente {
  if (!respostas.temAutoridadeReal) return "cliente_de_caixa";
  if (!respostas.aceitaDiagnostico) return "cliente_de_caixa";
  if (respostas.sinalNaoCumprimento) return "exigir_contrato_reforcado";
  return "prioridade_alta";
}
