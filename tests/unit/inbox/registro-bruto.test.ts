import { describe, it, expect } from "vitest";
import {
  determinarStatusInicial,
  podeSerClassificado,
  podeSerConfirmado,
  podeSerDescartado,
} from "@/inbox/domain/registro-bruto";

describe("determinarStatusInicial (Domain, Inbox)", () => {
  it("entradas textuais começam como 'capturado'", () => {
    expect(determinarStatusInicial("texto")).toBe("capturado");
    expect(determinarStatusInicial("observacao")).toBe("capturado");
    expect(determinarStatusInicial("mensagem")).toBe("capturado");
    expect(determinarStatusInicial("link")).toBe("capturado");
    expect(determinarStatusInicial("email")).toBe("capturado");
    expect(determinarStatusInicial("transcricao")).toBe("capturado");
  });

  it("entradas binárias começam como 'em_processamento'", () => {
    expect(determinarStatusInicial("audio")).toBe("em_processamento");
    expect(determinarStatusInicial("imagem")).toBe("em_processamento");
    expect(determinarStatusInicial("pdf")).toBe("em_processamento");
    expect(determinarStatusInicial("video")).toBe("em_processamento");
    expect(determinarStatusInicial("print")).toBe("em_processamento");
    expect(determinarStatusInicial("documento")).toBe("em_processamento");
  });
});

describe("podeSerClassificado (invariante: só classifica com texto disponível)", () => {
  it("permite classificar quando status é 'capturado' e há texto", () => {
    expect(
      podeSerClassificado({ status: "capturado", conteudoTexto: "algo relevante" })
    ).toBe(true);
  });

  it("nunca permite classificar sem conteúdo textual (ex: ainda em processamento)", () => {
    expect(podeSerClassificado({ status: "em_processamento", conteudoTexto: null })).toBe(false);
  });

  it("não permite classificar texto vazio/whitespace", () => {
    expect(podeSerClassificado({ status: "capturado", conteudoTexto: "   " })).toBe(false);
  });

  it("não permite classificar um registro já classificado ou descartado", () => {
    expect(podeSerClassificado({ status: "classificado", conteudoTexto: "x" })).toBe(false);
    expect(podeSerClassificado({ status: "descartado", conteudoTexto: "x" })).toBe(false);
  });
});

describe("podeSerConfirmado (invariante central: nunca classificado sem ação humana)", () => {
  it("permite confirmação apenas em capturado ou classificacao_sugerida", () => {
    expect(podeSerConfirmado({ status: "classificacao_sugerida" })).toBe(true);
    expect(podeSerConfirmado({ status: "capturado" })).toBe(true);
  });

  it("nunca permite confirmar um registro já classificado ou descartado", () => {
    expect(podeSerConfirmado({ status: "classificado" })).toBe(false);
    expect(podeSerConfirmado({ status: "descartado" })).toBe(false);
  });
});

describe("podeSerDescartado", () => {
  it("permite descartar em qualquer status exceto classificado/descartado", () => {
    expect(podeSerDescartado({ status: "capturado" })).toBe(true);
    expect(podeSerDescartado({ status: "em_processamento" })).toBe(true);
    expect(podeSerDescartado({ status: "classificacao_sugerida" })).toBe(true);
  });

  it("nunca permite descartar um registro já classificado", () => {
    expect(podeSerDescartado({ status: "classificado" })).toBe(false);
  });

  it("é idempotente: não permite descartar duas vezes", () => {
    expect(podeSerDescartado({ status: "descartado" })).toBe(false);
  });
});
