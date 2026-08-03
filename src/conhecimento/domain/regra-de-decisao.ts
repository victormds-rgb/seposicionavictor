/**
 * RegraDeDecisao (Reference Data, Bounded Context Conhecimento) —
 * representação consultável das duas árvores de decisão formais do
 * SOM (Cap. 7.1 e 2.6). A execução real dessas árvores já vive como
 * função pura de domínio (`avaliarCliente` em src/clientes/domain,
 * `avaliarPecaSemCase` em src/conhecimento/domain) — esta entidade
 * existe para consulta/exibição (UI_UX.md, seção 11), não para
 * reimplementar a lógica.
 */

export const APLICACOES_REGRA_DECISAO = ["cliente", "conteudo_sem_case"] as const;
export type AplicacaoRegraDecisao = (typeof APLICACOES_REGRA_DECISAO)[number];

export interface RegraDeDecisao {
  id: string;
  nome: string;
  estruturaArvore: Record<string, unknown>;
  aplicaA: AplicacaoRegraDecisao;
}

export const REGRAS_DE_DECISAO_SOM: Array<{
  nome: string;
  aplicaA: AplicacaoRegraDecisao;
  estruturaArvore: Record<string, unknown>;
}> = [
  {
    nome: "Aceitar ou Recusar Cliente",
    aplicaA: "cliente",
    estruturaArvore: {
      pergunta1: "Cliente tem autoridade/competência real no próprio setor?",
      seNao1: "aceitar apenas se o caixa exigir, sinalizado como 'cliente de caixa'",
      pergunta2: "Cliente aceita ouvir diagnóstico antes de exigir execução imediata?",
      seNao2: "aceitar só se necessário para caixa, com atrito esperado",
      pergunta3: "Existe sinal de não cumprimento de combinado (histórico/indicação)?",
      seSim3: "exigir contrato formal e pagamento adiantado",
      seNao3: "processo padrão",
      seSim1eSim2eNao3: "prioridade alta",
    },
  },
  {
    nome: "Framework sem Case",
    aplicaA: "conteudo_sem_case",
    estruturaArvore: {
      pergunta1: "Tenho case pessoal ou de cliente sobre o assunto?",
      seSim1: "use Prova e Portfólio (Capítulo 5)",
      pergunta2: "É tendência/notícia/tema de terceiros?",
      seSim2: "aplique Framework 1 ou 2 como lente crítica",
      pergunta3: "É reflexão pessoal/aprendizado em andamento?",
      seSim3: "use Quebra-Recuo-Volta ou Perguntas Recorrentes",
      seNao3: "não publique ainda — falta ângulo próprio",
    },
  },
];
