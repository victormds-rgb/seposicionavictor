import { describe, it, expect } from "vitest";
import {
  podeSerQualificado,
  podeSerAgendado,
  podeSerMarcadoComoReunido,
  podeSerConvertido,
} from "@/pipeline_comercial/domain/lead";

describe("Transições de status_comercial do Lead", () => {
  it("permite qualificar apenas a partir de 'novo' ou 'qualificando'", () => {
    expect(podeSerQualificado({ statusComercial: "novo" })).toBe(true);
    expect(podeSerQualificado({ statusComercial: "qualificando" })).toBe(true);
    expect(podeSerQualificado({ statusComercial: "qualificado" })).toBe(false);
  });

  it("permite agendar apenas a partir de 'qualificado'", () => {
    expect(podeSerAgendado({ statusComercial: "qualificado" })).toBe(true);
    expect(podeSerAgendado({ statusComercial: "novo" })).toBe(false);
    expect(podeSerAgendado({ statusComercial: "agendado" })).toBe(false);
  });

  it("permite marcar como reunido apenas a partir de 'agendado'", () => {
    expect(podeSerMarcadoComoReunido({ statusComercial: "agendado" })).toBe(true);
    expect(podeSerMarcadoComoReunido({ statusComercial: "qualificado" })).toBe(false);
  });

  it("invariante (ADR-006): só converte a partir de 'reunido' — nunca promove um lead novo direto", () => {
    expect(podeSerConvertido({ statusComercial: "reunido" })).toBe(true);
    expect(podeSerConvertido({ statusComercial: "novo" })).toBe(false);
    expect(podeSerConvertido({ statusComercial: "qualificado" })).toBe(false);
    expect(podeSerConvertido({ statusComercial: "agendado" })).toBe(false);
  });
});
