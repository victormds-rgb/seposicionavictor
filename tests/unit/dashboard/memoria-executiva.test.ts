import { describe, it, expect } from "vitest";
import {
  calcularMudancasDesdeUltimaVisita,
  interpretarUltimaVisita,
} from "@/app/(shell)/dashboard/memoria-executiva";

/**
 * Sprint 39 (Memória Executiva REAL do MeuCMO) — cobre exatamente os
 * cenários exigidos pela sprint. `calcularMudancasDesdeUltimaVisita`
 * é pura (sem I/O, sem repositório) — a comparação real acontece
 * comparando `dataDisparo`/`dataCaptura`/`criadoEm` (já existentes)
 * contra um `ultimaVisitaEm` recebido de fora.
 */
describe("calcularMudancasDesdeUltimaVisita", () => {
  const ontem = new Date("2026-08-06T12:00:00Z");
  const antesDeOntem = new Date("2026-08-05T12:00:00Z");
  const hoje = new Date("2026-08-07T12:00:00Z");
  const amanha = new Date("2026-08-08T12:00:00Z");

  it("primeira visita (ultimaVisitaEm null): nunca afirma que algo é novo, mesmo com dados existentes", () => {
    const resultado = calcularMudancasDesdeUltimaVisita({
      ultimaVisitaEm: null,
      alertas: [{ dataDisparo: antesDeOntem }, { dataDisparo: hoje }],
      registrosInbox: [{ dataCaptura: hoje }],
      projetosProntosParaCase: [{ criadoEm: hoje }],
    });

    expect(resultado).toEqual([]);
  });

  it("segunda visita sem mudanças: tudo aconteceu antes de ultimaVisitaEm → nenhuma mudança", () => {
    const resultado = calcularMudancasDesdeUltimaVisita({
      ultimaVisitaEm: hoje,
      alertas: [{ dataDisparo: ontem }, { dataDisparo: antesDeOntem }],
      registrosInbox: [{ dataCaptura: ontem }],
      projetosProntosParaCase: [{ criadoEm: antesDeOntem }],
    });

    expect(resultado).toEqual([]);
  });

  it("novo registro na Inbox depois da visita → aparece como novo", () => {
    const resultado = calcularMudancasDesdeUltimaVisita({
      ultimaVisitaEm: hoje,
      alertas: [],
      registrosInbox: [{ dataCaptura: amanha }],
      projetosProntosParaCase: [],
    });

    expect(resultado).toEqual(["1 novo registro chegou à Inbox."]);
  });

  it("novo alerta depois da visita → aparece como novo", () => {
    const resultado = calcularMudancasDesdeUltimaVisita({
      ultimaVisitaEm: hoje,
      alertas: [{ dataDisparo: amanha }],
      registrosInbox: [],
      projetosProntosParaCase: [],
    });

    expect(resultado).toEqual(["1 alerta novo desde sua última visita."]);
  });

  it("projeto que já existia antes da visita (mesmo pronto_para_case) → não aparece como novo", () => {
    const resultado = calcularMudancasDesdeUltimaVisita({
      ultimaVisitaEm: hoje,
      alertas: [],
      registrosInbox: [],
      projetosProntosParaCase: [{ criadoEm: antesDeOntem }],
    });

    expect(resultado).toEqual([]);
  });

  it("projeto criado depois da visita e pronto para Case → aparece", () => {
    const resultado = calcularMudancasDesdeUltimaVisita({
      ultimaVisitaEm: hoje,
      alertas: [],
      registrosInbox: [],
      projetosProntosParaCase: [{ criadoEm: amanha }],
    });

    expect(resultado).toEqual(["Um Projeto ficou pronto para virar Case."]);
  });

  it("múltiplas mudanças → todas corretamente contabilizadas, com pluralização", () => {
    const resultado = calcularMudancasDesdeUltimaVisita({
      ultimaVisitaEm: hoje,
      alertas: [{ dataDisparo: amanha }, { dataDisparo: amanha }],
      registrosInbox: [{ dataCaptura: amanha }, { dataCaptura: amanha }, { dataCaptura: amanha }],
      projetosProntosParaCase: [{ criadoEm: amanha }],
    });

    expect(resultado).toEqual([
      "2 alertas novos desde sua última visita.",
      "3 novos registros chegaram à Inbox.",
      "Um Projeto ficou pronto para virar Case.",
    ]);
  });

  it("data exatamente igual a ultimaVisitaEm não conta como nova (limite exclusivo)", () => {
    const resultado = calcularMudancasDesdeUltimaVisita({
      ultimaVisitaEm: hoje,
      alertas: [{ dataDisparo: hoje }],
      registrosInbox: [],
      projetosProntosParaCase: [],
    });

    expect(resultado).toEqual([]);
  });

  it("é pura: mesma entrada sempre produz a mesma saída, independente de quantas vezes é chamada", () => {
    const entrada = {
      ultimaVisitaEm: hoje,
      alertas: [{ dataDisparo: amanha }],
      registrosInbox: [{ dataCaptura: amanha }],
      projetosProntosParaCase: [{ criadoEm: amanha }],
    };

    const primeira = calcularMudancasDesdeUltimaVisita(entrada);
    const segunda = calcularMudancasDesdeUltimaVisita(entrada);

    // Garante que a função não tem estado escondido nem efeito
    // colateral que dependeria de QUANDO é chamada em relação à
    // atualização do timestamp — a atualização real acontece em outro
    // mecanismo por completo (Server Action disparada só depois do
    // mount no navegador, nunca durante este cálculo — ver
    // src/app/(shell)/dashboard/actions.ts e
    // _components/registrar-visita.tsx), então a ordem "compara antes
    // de atualizar" é garantida pela arquitetura, não por estado
    // testável aqui.
    expect(primeira).toEqual(segunda);
  });
});

describe("interpretarUltimaVisita", () => {
  it("undefined (nunca visitou) vira null", () => {
    expect(interpretarUltimaVisita(undefined)).toBeNull();
  });

  it("string ISO válida vira Date", () => {
    const resultado = interpretarUltimaVisita("2026-08-07T12:00:00.000Z");
    expect(resultado).toBeInstanceOf(Date);
    expect(resultado?.toISOString()).toBe("2026-08-07T12:00:00.000Z");
  });

  it("valor corrompido/inválido vira null em vez de quebrar (nunca inventa uma data)", () => {
    expect(interpretarUltimaVisita("isso não é uma data")).toBeNull();
    expect(interpretarUltimaVisita(12345)).toBeNull();
    expect(interpretarUltimaVisita({})).toBeNull();
  });
});
