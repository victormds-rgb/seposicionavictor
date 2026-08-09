import { describe, it, expect } from "vitest";
import { emailAutorizadoParaCadastro } from "@/app/cadastro/allowlist";

describe("emailAutorizadoParaCadastro", () => {
  it("sem lista configurada: recusa qualquer e-mail (fail-closed)", () => {
    expect(emailAutorizadoParaCadastro("victor@exemplo.com", undefined)).toBe(false);
    expect(emailAutorizadoParaCadastro("victor@exemplo.com", "")).toBe(false);
  });

  it("e-mail presente na lista: autoriza", () => {
    expect(emailAutorizadoParaCadastro("victor@exemplo.com", "victor@exemplo.com")).toBe(true);
  });

  it("comparação ignora maiúsculas/minúsculas e espaços", () => {
    expect(
      emailAutorizadoParaCadastro("  Victor@Exemplo.com  ", "outro@x.com, victor@exemplo.com")
    ).toBe(true);
  });

  it("e-mail fora da lista: recusa", () => {
    expect(emailAutorizadoParaCadastro("estranho@exemplo.com", "victor@exemplo.com")).toBe(false);
  });
});
