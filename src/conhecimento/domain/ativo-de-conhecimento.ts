/**
 * AtivoDeConhecimento (Entity, Bounded Context Conhecimento) —
 * SOM Cap. 2.3 (Banco de Perguntas Recorrentes) e 2.4 (Banco de
 * Analogias e Metáforas). Consolidados numa única entidade
 * (Decisão D7 da Revisão Arquitetural do Domínio).
 */

export const TIPOS_ATIVO_CONHECIMENTO = ["pergunta_recorrente", "analogia"] as const;
export type TipoAtivoConhecimento = (typeof TIPOS_ATIVO_CONHECIMENTO)[number];

export const STATUS_ATIVO_CONHECIMENTO = ["ativo", "arquivado"] as const;
export type StatusAtivoConhecimento = (typeof STATUS_ATIVO_CONHECIMENTO)[number];

export interface AtivoDeConhecimento {
  id: string;
  tipo: TipoAtivoConhecimento;
  conteudoTextual: string;
  origem: string | null;
  frequenciaUso: number;
  status: StatusAtivoConhecimento;
}

/** Conteúdo exato das 5 perguntas recorrentes, SOM.md Capítulo 2.3. */
export const PERGUNTAS_RECORRENTES_SOM: string[] = [
  "Isso resolve o problema, ou só torna o problema mais confortável de carregar?",
  "Quem se beneficia de continuar acreditando que esse é o problema real?",
  "Se essa ferramenta/técnica sumisse amanhã, o que mudaria de verdade?",
  "Essa explicação seria a mesma se não custasse nada admitir a real?",
  "O que essa pessoa/empresa está evitando olhar de frente?",
];

/** Conteúdo exato das 4 analogias e metáforas, SOM.md Capítulo 2.4. */
export const ANALOGIAS_SOM: string[] = [
  "A pedra no caminho (o obstáculo real, geralmente invisível)",
  "O vídeo feio que virou campanha boa (o material já estava lá, faltava aplicação)",
  "Cafeteria incrível, gerente errado (negócio bom que quebra por falta de sistema de confiança)",
  "Investir pouco por medo de perder é o jeito mais caro de perder",
];
