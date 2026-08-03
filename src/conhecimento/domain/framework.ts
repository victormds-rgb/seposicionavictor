/**
 * Framework (Reference Data, Bounded Context Conhecimento) —
 * SOM Cap. 2.2. Os 4 modelos mentais fundamentais da marca.
 */

export const NOMES_FRAMEWORK = [
  "Diagnóstico Antes da Ferramenta",
  "Régua da Desculpa",
  "Quebra, Recuo, Volta",
  "Coringa vs. Sob Medida",
] as const;
export type NomeFramework = (typeof NOMES_FRAMEWORK)[number];

export const STATUS_FRAMEWORK = ["ativo", "candidato_a_termo_proprio", "obsoleto"] as const;
export type StatusFramework = (typeof STATUS_FRAMEWORK)[number];

export interface Framework {
  id: string;
  nome: string;
  estruturaEtapas: string[];
  exemplosUso: string | null;
  status: StatusFramework;
}

/** Conteúdo exato dos 4 frameworks, a partir do SOM.md, Capítulo 2.2. */
export const FRAMEWORKS_SOM: Array<{ nome: NomeFramework; estruturaEtapas: string[]; exemplosUso: string }> = [
  {
    nome: "Diagnóstico Antes da Ferramenta",
    estruturaEtapas: [
      "O que essa ferramenta promete resolver?",
      "Que problema ela resolve de verdade, versus que sintoma ela só disfarça?",
      "Que tipo de empresa vai usá-la pra evitar o problema real?",
      "Em que situação ela faz diferença só depois que a causa real já foi endereçada?",
    ],
    exemplosUso: "Aplicado a toda novidade técnica de IA/automação (SOM Cap. 2.5).",
  },
  {
    nome: "Régua da Desculpa",
    estruturaEtapas: [
      "Nível 1 — Desculpa de recurso (não tenho dinheiro/tempo/equipe)",
      "Nível 2 — Desculpa de mercado (o mercado mudou, a concorrência, o algoritmo)",
      "Nível 3 — Desculpa de identidade (não sou esse tipo de empresa/pessoa)",
    ],
    exemplosUso: "Aplicado a objeções de venda e problemas de equipe (SOM Cap. 2.5).",
  },
  {
    nome: "Quebra, Recuo, Volta",
    estruturaEtapas: [
      "Quebra: o que deu errado de fato, sem edição",
      "Recuo: o que foi feito no período de reorganização",
      "Volta: o que ficou diferente na volta",
    ],
    exemplosUso: "Aplicado a bastidores, erros e construção de produto (SOM Cap. 2.5).",
  },
  {
    nome: "Coringa vs. Sob Medida",
    estruturaEtapas: [
      "Ferramenta genérica (\"coringa\"): CRM, chatbot, dashboard",
      "Aplicação sob medida: só funciona após diagnóstico certo",
    ],
    exemplosUso: "Aplicado a automação (SOM Cap. 2.5).",
  },
];
