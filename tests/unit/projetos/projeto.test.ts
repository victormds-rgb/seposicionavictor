import { describe, it, expect } from "vitest";
import {
  criacaoValida,
  camposDeCaseCompletos,
  podeTransicionarParaProntoParaCase,
  podeSerEncerrado,
} from "@/projetos/domain/projeto";

describe("criacaoValida (invariante SOM Cap. 5.3)", () => {
  it("projeto de cliente_externo exige clienteId, desculpaInicial e custoMensal", () => {
    expect(
      criacaoValida({
        tipo: "cliente_externo",
        clienteId: "algum-id",
        desculpaInicial: "acha que investir pouco é seguro",
        custoMensal: 1500,
      })
    ).toBe(true);
  });

  it("nunca permite criar projeto de cliente_externo sem desculpa inicial", () => {
    expect(
      criacaoValida({
        tipo: "cliente_externo",
        clienteId: "algum-id",
        desculpaInicial: null,
        custoMensal: 1500,
      })
    ).toBe(false);
  });

  it("nunca permite criar projeto de cliente_externo sem custo mensal", () => {
    expect(
      criacaoValida({
        tipo: "cliente_externo",
        clienteId: "algum-id",
        desculpaInicial: "desculpa válida",
        custoMensal: null,
      })
    ).toBe(false);
  });

  it("nunca permite criar projeto de cliente_externo sem clienteId", () => {
    expect(
      criacaoValida({
        tipo: "cliente_externo",
        clienteId: null,
        desculpaInicial: "desculpa válida",
        custoMensal: 1500,
      })
    ).toBe(false);
  });

  it("produto_proprio não exige nenhum desses campos", () => {
    expect(
      criacaoValida({
        tipo: "produto_proprio",
        clienteId: null,
        desculpaInicial: null,
        custoMensal: null,
      })
    ).toBe(true);
  });
});

const projetoBase = {
  status: "em_andamento" as const,
  desculpaInicial: "desculpa",
  custoMensal: 100,
  momentoQuebra: null as string | null,
  solucao: null as string | null,
  tempoDecorrido: null as string | null,
  numeroResultado: null as string | null,
};

describe("camposDeCaseCompletos / podeTransicionarParaProntoParaCase", () => {
  it("não está completo enquanto faltar qualquer um dos 6 campos", () => {
    expect(camposDeCaseCompletos(projetoBase)).toBe(false);
    expect(podeTransicionarParaProntoParaCase(projetoBase)).toBe(false);
  });

  it("transiciona para pronto_para_case somente quando os 6 campos estão completos", () => {
    const completo = {
      ...projetoBase,
      momentoQuebra: "cliente percebeu o custo real",
      solucao: "nova campanha",
      tempoDecorrido: "1 mês",
      numeroResultado: "30 leads/mês",
    };
    expect(camposDeCaseCompletos(completo)).toBe(true);
    expect(podeTransicionarParaProntoParaCase(completo)).toBe(true);
  });

  it("nunca transiciona a partir de um projeto já encerrado ou pronto_para_case", () => {
    const completo = {
      ...projetoBase,
      status: "encerrado" as const,
      momentoQuebra: "x",
      solucao: "y",
      tempoDecorrido: "z",
      numeroResultado: "w",
    };
    expect(podeTransicionarParaProntoParaCase(completo)).toBe(false);
  });
});

describe("podeSerEncerrado", () => {
  it("permite encerrar qualquer status exceto já encerrado", () => {
    expect(podeSerEncerrado({ status: "iniciado" })).toBe(true);
    expect(podeSerEncerrado({ status: "pronto_para_case" })).toBe(true);
    expect(podeSerEncerrado({ status: "encerrado" })).toBe(false);
  });
});
