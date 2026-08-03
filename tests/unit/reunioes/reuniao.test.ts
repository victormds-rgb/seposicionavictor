import { describe, it, expect } from "vitest";
import {
  podeSerMarcadaComoRealizada,
  podeSerProcessada,
  podeSerCancelada,
} from "@/reunioes/domain/reuniao";

describe("podeSerMarcadaComoRealizada", () => {
  it("permite apenas a partir de 'agendada'", () => {
    expect(podeSerMarcadaComoRealizada({ status: "agendada" })).toBe(true);
    expect(podeSerMarcadaComoRealizada({ status: "realizada" })).toBe(false);
    expect(podeSerMarcadaComoRealizada({ status: "processada" })).toBe(false);
    expect(podeSerMarcadaComoRealizada({ status: "cancelada" })).toBe(false);
  });
});

describe("podeSerProcessada (invariante: exige RegistroBruto classificado)", () => {
  it("nunca permite processar sem RegistroBruto classificado, mesmo estando 'realizada'", () => {
    expect(podeSerProcessada({ status: "realizada" }, false)).toBe(false);
  });

  it("permite processar apenas quando 'realizada' E há RegistroBruto classificado", () => {
    expect(podeSerProcessada({ status: "realizada" }, true)).toBe(true);
  });

  it("nunca permite processar uma reunião ainda 'agendada', mesmo com registro classificado", () => {
    expect(podeSerProcessada({ status: "agendada" }, true)).toBe(false);
  });
});

describe("podeSerCancelada", () => {
  it("permite cancelar agendada ou realizada", () => {
    expect(podeSerCancelada({ status: "agendada" })).toBe(true);
    expect(podeSerCancelada({ status: "realizada" })).toBe(true);
  });

  it("não permite cancelar uma reunião já processada ou cancelada", () => {
    expect(podeSerCancelada({ status: "processada" })).toBe(false);
    expect(podeSerCancelada({ status: "cancelada" })).toBe(false);
  });
});
