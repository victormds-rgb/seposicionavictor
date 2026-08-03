import { describe, it, expect } from "vitest";
import { os6CamposCompletos, podeSerMarcadoComoCompleto, podeSerPublicado } from "@/cases/domain/case";

const caseCompleto = {
  desculpa: "achava que investir pouco era seguro",
  custo: 500,
  momentoQuebra: "percebeu o custo real de não investir",
  solucao: "nova campanha com criativos revisados",
  tempo: "1 semana",
  numeroResultado: "20+ mensagens com R$200 investidos",
};

describe("os6CamposCompletos / podeSerMarcadoComoCompleto (invariante: nunca completo com campo ausente)", () => {
  it("reconhece um case com todos os 6 campos preenchidos", () => {
    expect(os6CamposCompletos(caseCompleto)).toBe(true);
    expect(podeSerMarcadoComoCompleto(caseCompleto)).toBe(true);
  });

  it("nunca considera completo se faltar qualquer um dos 6 campos", () => {
    for (const campo of Object.keys(caseCompleto) as Array<keyof typeof caseCompleto>) {
      const incompleto = { ...caseCompleto, [campo]: campo === "custo" ? null : "" };
      expect(os6CamposCompletos(incompleto)).toBe(false);
    }
  });
});

describe("podeSerPublicado (invariante: só publica um case já completo)", () => {
  it("permite publicar apenas a partir de 'completo'", () => {
    expect(podeSerPublicado({ status: "completo" })).toBe(true);
    expect(podeSerPublicado({ status: "incompleto" })).toBe(false);
    expect(podeSerPublicado({ status: "publicado" })).toBe(false);
  });
});
