import { describe, it, expect } from "vitest";
import { avaliarPecaSemCase } from "@/conhecimento/domain/arvore-framework-sem-case";
import { somaDosPesosAlvoValida } from "@/conteudo/domain/pilar";
import { TEMAS_MAPEADOS_SOM } from "@/conhecimento/domain/tema-mapeado";
import { FRAMEWORKS_SOM } from "@/conhecimento/domain/framework";

describe("avaliarPecaSemCase — árvore de decisão do SOM Cap. 2.6 (todos os 4 ramos)", () => {
  it("tem caso pessoal/de cliente → usar Prova e Portfólio, independente das demais respostas", () => {
    expect(
      avaliarPecaSemCase({
        temCasoPessoalOuDeCliente: true,
        ehTendenciaOuNoticiaDeTerceiros: true,
        ehReflexaoPessoalOuAprendizado: true,
      })
    ).toBe("usar_prova_e_portfolio");
  });

  it("sem caso, mas é tendência/notícia de terceiros → aplicar framework crítico", () => {
    expect(
      avaliarPecaSemCase({
        temCasoPessoalOuDeCliente: false,
        ehTendenciaOuNoticiaDeTerceiros: true,
        ehReflexaoPessoalOuAprendizado: false,
      })
    ).toBe("aplicar_framework_critico");
  });

  it("sem caso, não é tendência, mas é reflexão pessoal → Quebra-Recuo-Volta ou Perguntas", () => {
    expect(
      avaliarPecaSemCase({
        temCasoPessoalOuDeCliente: false,
        ehTendenciaOuNoticiaDeTerceiros: false,
        ehReflexaoPessoalOuAprendizado: true,
      })
    ).toBe("usar_quebra_recuo_volta_ou_perguntas");
  });

  it("nenhuma das três condições → não publicar ainda, falta ângulo próprio", () => {
    expect(
      avaliarPecaSemCase({
        temCasoPessoalOuDeCliente: false,
        ehTendenciaOuNoticiaDeTerceiros: false,
        ehReflexaoPessoalOuAprendizado: false,
      })
    ).toBe("nao_publicar_ainda");
  });
});

describe("Referências fixas do SOM — consistência interna", () => {
  it("existem exatamente 4 frameworks (SOM Cap. 2.2)", () => {
    expect(FRAMEWORKS_SOM).toHaveLength(4);
  });

  it("existem exatamente 12 temas mapeados no SOM.md, Cap. 2.5 (não 18 — ver nota de governança)", () => {
    expect(TEMAS_MAPEADOS_SOM).toHaveLength(12);
  });

  it("todo framework referenciado pelos temas existe na lista oficial de frameworks", () => {
    const nomesValidos = new Set(FRAMEWORKS_SOM.map((f) => f.nome));
    for (const tema of TEMAS_MAPEADOS_SOM) {
      for (const nomeFramework of tema.frameworks) {
        expect(nomesValidos.has(nomeFramework)).toBe(true);
      }
    }
  });

  it("a soma dos pesos-alvo dos pilares (Sprint 6) segue válida (regressão)", () => {
    expect(somaDosPesosAlvoValida([{ pesoAlvoPercentual: 30 }, { pesoAlvoPercentual: 25 }, { pesoAlvoPercentual: 20 }, { pesoAlvoPercentual: 15 }, { pesoAlvoPercentual: 10 }])).toBe(true);
  });
});
