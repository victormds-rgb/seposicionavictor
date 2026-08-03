import { describe, it, expect } from "vitest";
import { os4CamposCompletos, podeSerPublicado } from "@/build_logs/domain/build-log";

const logCompleto = {
  contexto: "tentando validar o Radar AI com um primeiro usuário externo",
  quebra: "a interface travou no meio do onboarding",
  decisao: "simplificar o fluxo para 2 passos antes de tentar de novo",
  proximoPasso: "testar com mais 2 usuários essa semana",
};

describe("os4CamposCompletos (invariante: template fixo de 4 campos)", () => {
  it("reconhece um build log com os 4 campos preenchidos", () => {
    expect(os4CamposCompletos(logCompleto)).toBe(true);
  });

  it("nunca considera completo se faltar qualquer um dos 4 campos", () => {
    for (const campo of Object.keys(logCompleto) as Array<keyof typeof logCompleto>) {
      const incompleto = { ...logCompleto, [campo]: "" };
      expect(os4CamposCompletos(incompleto)).toBe(false);
    }
  });
});

describe("podeSerPublicado (invariante: nunca publicado sem os 4 campos e status rascunho)", () => {
  it("permite publicar quando rascunho e os 4 campos completos", () => {
    expect(podeSerPublicado({ ...logCompleto, status: "rascunho" })).toBe(true);
  });

  it("nunca permite publicar com campo ausente, mesmo em rascunho", () => {
    expect(podeSerPublicado({ ...logCompleto, contexto: "", status: "rascunho" })).toBe(false);
  });

  it("nunca permite publicar um build log que já foi publicado", () => {
    expect(podeSerPublicado({ ...logCompleto, status: "publicado" })).toBe(false);
  });
});
