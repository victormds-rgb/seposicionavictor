import { describe, it, expect } from "vitest";
import { podeTransicionar } from "@/ia/domain/sugestao-ia";

describe("podeTransicionar (SugestaoIA) — invariante: nunca 'aceita' sem ação humana", () => {
  it("permite pendente → aceita", () => {
    expect(podeTransicionar("pendente", "aceita")).toBe(true);
  });

  it("permite pendente → rejeitada", () => {
    expect(podeTransicionar("pendente", "rejeitada")).toBe(true);
  });

  it("permite pendente → editada_e_aceita", () => {
    expect(podeTransicionar("pendente", "editada_e_aceita")).toBe(true);
  });

  it("nunca permite transicionar a partir de um status que não seja pendente", () => {
    expect(podeTransicionar("aceita", "rejeitada")).toBe(false);
    expect(podeTransicionar("rejeitada", "aceita")).toBe(false);
    expect(podeTransicionar("editada_e_aceita", "aceita")).toBe(false);
  });

  it("nunca permite transicionar pendente → pendente (não é uma transição real)", () => {
    expect(podeTransicionar("pendente", "pendente")).toBe(false);
  });
});
