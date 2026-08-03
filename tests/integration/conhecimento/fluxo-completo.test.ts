import { describe, it, expect } from "vitest";
import {
  DrizzleFrameworkRepository,
  DrizzleTemaMapeadoRepository,
} from "@/conhecimento/infrastructure/framework-e-tema-repository";
import {
  DrizzleAtivoDeConhecimentoRepository,
  DrizzleRegraDeDecisaoRepository,
} from "@/conhecimento/infrastructure/ativo-e-regra-repository";
import { listarFrameworks, listarTemasMapeados, listarAtivosDeConhecimento, listarRegrasDeDecisao } from "@/conhecimento/application/consultas";
import { sugerirAbordagemParaPecaSemCase } from "@/conhecimento/application/sugerir-abordagem-para-peca-sem-case";
import { registrarAtivoDeConhecimento } from "@/conhecimento/application/registrar-ativo-de-conhecimento";

describe("Bounded Context Conhecimento (integração — Reference Data semeada na Sprint 7)", () => {
  const frameworkRepository = new DrizzleFrameworkRepository();
  const temaMapeadoRepository = new DrizzleTemaMapeadoRepository();
  const ativoDeConhecimentoRepository = new DrizzleAtivoDeConhecimentoRepository();
  const regraDeDecisaoRepository = new DrizzleRegraDeDecisaoRepository();

  it("os 4 frameworks estão povoados e consultáveis (Critério de Aceite da Sprint 7)", async () => {
    const frameworks = await listarFrameworks({ frameworkRepository });
    expect(frameworks).toHaveLength(4);
    expect(frameworks.map((f) => f.nome)).toContain("Régua da Desculpa");
  });

  it("os 12 temas mapeados do SOM.md estão povoados, com frameworks corretamente associados", async () => {
    const temas = await listarTemasMapeados({ temaMapeadoRepository });
    expect(temas).toHaveLength(12);

    const temaVendas = temas.find((t) => t.nomeTema === "Vendas");
    expect(temaVendas?.frameworks.map((f) => f.nome)).toEqual(["Régua da Desculpa"]);

    const temaTendencias = temas.find((t) => t.nomeTema === "Tendências de mercado");
    expect(temaTendencias?.frameworks).toHaveLength(2); // Framework 1 + Régua da Desculpa

    const temaEstudos = temas.find((t) => t.nomeTema === "Estudos/Aprendizado");
    expect(temaEstudos?.frameworks).toHaveLength(0); // sem framework, usa Perguntas Recorrentes
  });

  it("as 2 regras de decisão (Cap. 7.1 e 2.6) estão povoadas e consultáveis", async () => {
    const regras = await listarRegrasDeDecisao({ regraDeDecisaoRepository });
    expect(regras).toHaveLength(2);
    expect(regras.map((r) => r.aplicaA).sort()).toEqual(["cliente", "conteudo_sem_case"]);
  });

  it("as 5 perguntas e 4 analogias originais do SOM.md estão presentes (por conteúdo, não por contagem total — outros testes deste arquivo também escrevem na tabela)", async () => {
    const perguntas = await listarAtivosDeConhecimento(
      { tipo: "pergunta_recorrente" },
      { ativoDeConhecimentoRepository }
    );
    const analogias = await listarAtivosDeConhecimento(
      { tipo: "analogia" },
      { ativoDeConhecimentoRepository }
    );

    expect(perguntas.length).toBeGreaterThanOrEqual(5);
    expect(analogias.length).toBeGreaterThanOrEqual(4);
    expect(
      perguntas.some((p) =>
        p.conteudoTextual.startsWith("O que essa pessoa/empresa está evitando olhar de frente?")
      )
    ).toBe(true);
    expect(
      analogias.some((a) => a.conteudoTextual.startsWith("A pedra no caminho"))
    ).toBe(true);
  });

  it("registra um novo Ativo de Conhecimento e incrementa a contagem em exatamente 1 (Cap. 9.6 — surgido de uso real)", async () => {
    const antes = await listarAtivosDeConhecimento(
      { tipo: "pergunta_recorrente" },
      { ativoDeConhecimentoRepository }
    );

    const novo = await registrarAtivoDeConhecimento(
      { tipo: "pergunta_recorrente", conteudoTextual: `Pergunta de teste — marcador ${Date.now()}` },
      { ativoDeConhecimentoRepository }
    );
    expect(novo.frequenciaUso).toBe(0);
    expect(novo.status).toBe("ativo");

    const depois = await listarAtivosDeConhecimento(
      { tipo: "pergunta_recorrente" },
      { ativoDeConhecimentoRepository }
    );
    expect(depois.length).toBe(antes.length + 1);
  });

  it("Critério de Aceite central: uma Peça sem Case pode ser criada seguindo a árvore do Cap. 2.6, com sugestão de framework pelo tema", async () => {
    const temas = await temaMapeadoRepository.listar();
    const temaVendas = temas.find((t) => t.nomeTema === "Vendas")!;

    const sugestaoComCase = await sugerirAbordagemParaPecaSemCase(
      {
        temaId: temaVendas.id,
        temCasoPessoalOuDeCliente: true,
        ehTendenciaOuNoticiaDeTerceiros: false,
        ehReflexaoPessoalOuAprendizado: false,
      },
      { temaMapeadoRepository }
    );
    expect(sugestaoComCase.recomendacao).toBe("usar_prova_e_portfolio");

    const sugestaoTendencia = await sugerirAbordagemParaPecaSemCase(
      {
        temaId: temaVendas.id,
        temCasoPessoalOuDeCliente: false,
        ehTendenciaOuNoticiaDeTerceiros: true,
        ehReflexaoPessoalOuAprendizado: false,
      },
      { temaMapeadoRepository }
    );
    expect(sugestaoTendencia.recomendacao).toBe("aplicar_framework_critico");
    expect(sugestaoTendencia.frameworksDoTema).toEqual(["Régua da Desculpa"]);
  });
});
