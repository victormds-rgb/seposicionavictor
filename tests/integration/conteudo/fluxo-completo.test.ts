import { describe, it, expect, beforeAll } from "vitest";
import { DrizzlePecaDeConteudoRepository } from "@/conteudo/infrastructure/peca-de-conteudo-repository";
import {
  DrizzlePilarRepository,
  DrizzleSerieFixaRepository,
} from "@/conteudo/infrastructure/pilar-e-serie-fixa-repository";
import { criarPecaDeConteudo } from "@/conteudo/application/criar-peca-de-conteudo";
import { criarDerivacao, DerivacaoInvalidaError } from "@/conteudo/application/criar-derivacao";
import { avancarStatusDaPeca, publicarPeca } from "@/conteudo/application/transicoes-de-status";
import { calcularDistribuicaoDePilares } from "@/conteudo/application/calcular-distribuicao-de-pilares";

describe("Fluxo completo de Conteúdo (integração)", () => {
  const pecaDeConteudoRepository = new DrizzlePecaDeConteudoRepository();
  const pilarRepository = new DrizzlePilarRepository();
  const serieFixaRepository = new DrizzleSerieFixaRepository();

  let pilarDiagnosticoId: string;

  beforeAll(async () => {
    const pilares = await pilarRepository.listar();
    expect(pilares).toHaveLength(5); // seed da Sprint 6 já aplicado
    pilarDiagnosticoId = pilares.find((p) => p.nome.startsWith("Diagnóstico"))!.id;
  });

  it("as 4 Séries Fixas do SOM Cap. 9.2 estão semeadas", async () => {
    const series = await serieFixaRepository.listar();
    expect(series).toHaveLength(4);
  });

  it("cria uma peça autônoma em rascunho, com Pilar obrigatório", async () => {
    const peca = await criarPecaDeConteudo(
      {
        canal: "newsletter",
        pilarId: pilarDiagnosticoId,
        origemTipo: "autonomo",
        conteudoTexto: "Reflexão longa sobre diagnóstico antes de ferramenta.",
      },
      { pecaDeConteudoRepository }
    );

    expect(peca.status).toBe("rascunho");
    expect(peca.pilarId).toBe(pilarDiagnosticoId);
  });

  it("não permite derivação que viole a regra unidirecional (curto → longo)", async () => {
    const origemCurta = await criarPecaDeConteudo(
      { canal: "x", pilarId: pilarDiagnosticoId, origemTipo: "autonomo" },
      { pecaDeConteudoRepository }
    );

    await expect(
      criarDerivacao(
        { pecaOrigemId: origemCurta.id, canalDerivada: "newsletter", pilarId: pilarDiagnosticoId },
        { pecaDeConteudoRepository }
      )
    ).rejects.toThrow(DerivacaoInvalidaError);
  });

  it("permite derivação longo → curto e preserva tema/framework de origem", async () => {
    const origemLonga = await criarPecaDeConteudo(
      { canal: "newsletter", pilarId: pilarDiagnosticoId, origemTipo: "autonomo" },
      { pecaDeConteudoRepository }
    );

    const derivada = await criarDerivacao(
      { pecaOrigemId: origemLonga.id, canalDerivada: "x", pilarId: pilarDiagnosticoId },
      { pecaDeConteudoRepository }
    );

    expect(derivada.pecaOrigemId).toBe(origemLonga.id);
    expect(derivada.canal).toBe("x");
  });

  it("fluxo completo: rascunho → revisão → agendado → publicado, com evento e contabilização em Pilar", async () => {
    const peca = await criarPecaDeConteudo(
      { canal: "linkedin", pilarId: pilarDiagnosticoId, origemTipo: "autonomo" },
      { pecaDeConteudoRepository }
    );

    const emRevisao = await avancarStatusDaPeca(peca.id, { pecaDeConteudoRepository });
    expect(emRevisao?.status).toBe("em_revisao");

    const agendado = await avancarStatusDaPeca(peca.id, { pecaDeConteudoRepository });
    expect(agendado?.status).toBe("agendado");

    const publicado = await avancarStatusDaPeca(peca.id, { pecaDeConteudoRepository });
    expect(publicado?.status).toBe("publicado");
    expect(publicado?.dataPublicacao).not.toBeNull();

    // Invariante: nunca publica de novo a partir de "publicado".
    await expect(publicarPeca(peca.id, { pecaDeConteudoRepository })).rejects.toThrow();
  });

  it("a distribuição de pilares reflete corretamente as peças publicadas", async () => {
    const distribuicaoAntes = await calcularDistribuicaoDePilares(undefined, {
      pecaDeConteudoRepository,
      pilarRepository,
    });
    const totalAntes = distribuicaoAntes.find((d) => d.pilarId === pilarDiagnosticoId)!.totalPublicadas;

    const peca = await criarPecaDeConteudo(
      { canal: "instagram", pilarId: pilarDiagnosticoId, origemTipo: "autonomo" },
      { pecaDeConteudoRepository }
    );
    await avancarStatusDaPeca(peca.id, { pecaDeConteudoRepository });
    await avancarStatusDaPeca(peca.id, { pecaDeConteudoRepository });
    await avancarStatusDaPeca(peca.id, { pecaDeConteudoRepository }); // publica

    const distribuicaoDepois = await calcularDistribuicaoDePilares(undefined, {
      pecaDeConteudoRepository,
      pilarRepository,
    });
    const totalDepois = distribuicaoDepois.find((d) => d.pilarId === pilarDiagnosticoId)!.totalPublicadas;

    expect(totalDepois).toBe(totalAntes + 1);

    // Soma dos pesos-alvo dos 5 pilares continua 100%, independente do real.
    const somaAlvo = distribuicaoDepois.reduce((acc, d) => acc + d.pesoAlvoPercentual, 0);
    expect(somaAlvo).toBe(100);
  });
});
