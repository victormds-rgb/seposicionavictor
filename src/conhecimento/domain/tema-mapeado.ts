import type { NomeFramework } from "./framework";

/**
 * TemaMapeado (Reference Data, Bounded Context Conhecimento) —
 * SOM Cap. 2.5.
 *
 * NOTA DE GOVERNANÇA (Sprint 7): o SOM.md, Capítulo 2.5 (Mapa de
 * Temas), a única enumeração formal e explícita de temas no documento
 * de maior precedência (ENGINEERING_MANIFEST.md), lista exatamente
 * **12 temas** — não 18, como SOFTWARE_SPEC.md, DOMAIN_MODEL.md e
 * IMPLEMENTATION_PLAN.md mencionam repetidamente ("os 18 temas
 * mapeados"). Essa divergência já havia sido sinalizada como "Lacuna
 * 1" no Engineering Kickoff Report (antes da Sprint 0) e ficou em
 * aberto até agora, quando a implementação exige uma decisão
 * concreta. Segui os 12 temas literais do SOM.md, por ser o
 * documento de maior precedência da cadeia (SOM.md → SOFTWARE_SPEC.md
 * → DOMAIN_MODEL.md → ... — ENGINEERING_MANIFEST.md). Recomendo um
 * novo item de backlog arquitetural (AB-004) para atualizar os
 * demais documentos e eliminar a menção a "18 temas".
 */
export interface TemaComFrameworks {
  nomeTema: string;
  frameworks: NomeFramework[];
}

export const TEMAS_MAPEADOS_SOM: TemaComFrameworks[] = [
  { nomeTema: "IA", frameworks: ["Diagnóstico Antes da Ferramenta"] },
  { nomeTema: "Automação", frameworks: ["Coringa vs. Sob Medida"] },
  { nomeTema: "Vendas", frameworks: ["Régua da Desculpa"] },
  { nomeTema: "Gestão/Liderança", frameworks: ["Régua da Desculpa"] },
  { nomeTema: "Produtividade", frameworks: ["Diagnóstico Antes da Ferramenta"] },
  { nomeTema: "Construção de produto", frameworks: ["Quebra, Recuo, Volta"] },
  { nomeTema: "Empreendedorismo", frameworks: ["Quebra, Recuo, Volta"] },
  // Sem framework associado no SOM — usa Perguntas Recorrentes (AtivoDeConhecimento), não um Framework.
  { nomeTema: "Estudos/Aprendizado", frameworks: [] },
  { nomeTema: "Bastidores/Build in Public", frameworks: ["Quebra, Recuo, Volta"] },
  {
    nomeTema: "Tendências de mercado",
    frameworks: ["Diagnóstico Antes da Ferramenta", "Régua da Desculpa"],
  },
  { nomeTema: "Casos reais de clientes", frameworks: ["Régua da Desculpa"] },
  { nomeTema: "Erros", frameworks: ["Quebra, Recuo, Volta"] },
];
