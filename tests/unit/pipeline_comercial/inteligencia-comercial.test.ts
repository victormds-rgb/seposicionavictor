import { describe, it, expect } from "vitest";
import {
  calcularScoreComercial,
  leadEstaParado,
  diasSemContato,
  calcularOportunidadesComerciais,
  LIMITE_HORAS_LEAD_PARADO,
} from "@/pipeline_comercial/domain/inteligencia-comercial";
import type { Lead } from "@/pipeline_comercial/domain/lead";

/**
 * Sprint 42 (Fundação Comercial) — todas as funções aqui são puras
 * (sem I/O), mesmo padrão de `tests/unit/dashboard/memoria-executiva.test.ts`
 * (Sprint 39). `agora` é sempre passado explicitamente.
 */

const AGORA = new Date("2026-08-08T12:00:00Z");

function leadBase(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead-1",
    nome: "Lead de teste",
    origemLead: null,
    sdrResponsavel: null,
    temperatura: null,
    ticketEstimado: null,
    statusComercial: "novo",
    metadata: null,
    canalOrigem: null,
    campanha: null,
    interesse: null,
    ultimoContatoEm: null,
    proximoContatoEm: null,
    motivoPerda: null,
    criadoEm: AGORA,
    ...overrides,
  };
}

describe("calcularScoreComercial", () => {
  it("lead sem dados suficientes (só nome, recém-criado): score mínimo (0), sem quebrar", () => {
    const lead = leadBase({ criadoEm: AGORA });
    const score = calcularScoreComercial(lead, { agora: AGORA, temQualificacaoRegistrada: false });
    expect(score).toBe(0);
  });

  it("temperatura e estágio somam pontos independentes (nenhum double-count com 'reunião realizada')", () => {
    const frioNovo = leadBase({ temperatura: "frio", statusComercial: "novo" });
    const quenteReunido = leadBase({ temperatura: "quente", statusComercial: "reunido" });

    const scoreFrioNovo = calcularScoreComercial(frioNovo, { agora: AGORA, temQualificacaoRegistrada: false });
    const scoreQuenteReunido = calcularScoreComercial(quenteReunido, {
      agora: AGORA,
      temQualificacaoRegistrada: false,
    });

    expect(scoreFrioNovo).toBe(0);
    expect(scoreQuenteReunido).toBe(30 + 35); // temperatura quente (30) + estágio reunido (35)
  });

  it("qualificação registrada, ticket estimado e próximo contato somam pontos binários", () => {
    const lead = leadBase({
      ticketEstimado: 5000,
      proximoContatoEm: new Date("2026-08-10T00:00:00Z"),
    });
    const score = calcularScoreComercial(lead, { agora: AGORA, temQualificacaoRegistrada: true });
    expect(score).toBe(15 + 10 + 10); // qualificação + ticket + próximo contato
  });

  it("penalidade cresce com o tempo sem contato e o score nunca fica negativo", () => {
    const leadMuitoParado = leadBase({
      temperatura: "quente",
      criadoEm: new Date("2026-01-01T00:00:00Z"), // muito antes de AGORA, sem contato desde então
    });
    const score = calcularScoreComercial(leadMuitoParado, { agora: AGORA, temQualificacaoRegistrada: false });
    expect(score).toBe(0); // 30 de temperatura - 40 de penalidade máxima, limitado a 0
  });

  it("score é null para leads resolvidos (convertido_cliente/perdido) — deixou de fazer sentido priorizar", () => {
    const convertido = leadBase({ statusComercial: "convertido_cliente", temperatura: "quente" });
    const perdido = leadBase({ statusComercial: "perdido", temperatura: "quente" });

    expect(calcularScoreComercial(convertido, { agora: AGORA, temQualificacaoRegistrada: true })).toBeNull();
    expect(calcularScoreComercial(perdido, { agora: AGORA, temQualificacaoRegistrada: true })).toBeNull();
  });

  it("score nunca ultrapassa 100", () => {
    const leadMaximo = leadBase({
      temperatura: "quente",
      statusComercial: "reunido",
      ticketEstimado: 10000,
      proximoContatoEm: AGORA,
    });
    const score = calcularScoreComercial(leadMaximo, { agora: AGORA, temQualificacaoRegistrada: true });
    expect(score).toBe(100); // 30 + 35 + 15 + 10 + 10 = 100 exatos
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("diasSemContato", () => {
  it("usa ultimoContatoEm quando existe", () => {
    const lead = leadBase({
      criadoEm: new Date("2026-01-01T00:00:00Z"),
      ultimoContatoEm: new Date("2026-08-06T12:00:00Z"), // 2 dias antes de AGORA
    });
    expect(diasSemContato(lead, AGORA)).toBeCloseTo(2, 5);
  });

  it("usa criadoEm quando nunca houve contato", () => {
    const lead = leadBase({ criadoEm: new Date("2026-08-01T12:00:00Z") }); // 7 dias antes de AGORA
    expect(diasSemContato(lead, AGORA)).toBeCloseTo(7, 5);
  });
});

describe("leadEstaParado", () => {
  it(`considera parado após mais de ${LIMITE_HORAS_LEAD_PARADO}h sem contato`, () => {
    const lead = leadBase({
      criadoEm: new Date(AGORA.getTime() - (LIMITE_HORAS_LEAD_PARADO + 1) * 60 * 60 * 1000),
    });
    expect(leadEstaParado(lead, AGORA)).toBe(true);
  });

  it("não considera parado dentro do limite", () => {
    const lead = leadBase({
      criadoEm: new Date(AGORA.getTime() - (LIMITE_HORAS_LEAD_PARADO - 1) * 60 * 60 * 1000),
    });
    expect(leadEstaParado(lead, AGORA)).toBe(false);
  });

  it("exclui convertido_cliente, perdido e agendado mesmo se o tempo já passou do limite", () => {
    const muitoTempo = new Date(AGORA.getTime() - 30 * 24 * 60 * 60 * 1000);
    for (const status of ["convertido_cliente", "perdido", "agendado"] as const) {
      const lead = leadBase({ criadoEm: muitoTempo, statusComercial: status });
      expect(leadEstaParado(lead, AGORA)).toBe(false);
    }
  });

  it("um lead recém-criado nunca está parado", () => {
    const lead = leadBase({ criadoEm: AGORA });
    expect(leadEstaParado(lead, AGORA)).toBe(false);
  });
});

describe("calcularOportunidadesComerciais", () => {
  it("agrupa quentes, parados e follow-ups de hoje sem misturar leads resolvidos", () => {
    const quente = leadBase({ id: "quente", temperatura: "quente", criadoEm: AGORA });
    const parado = leadBase({
      id: "parado",
      criadoEm: new Date(AGORA.getTime() - 72 * 60 * 60 * 1000),
    });
    const followUpHoje = leadBase({ id: "follow-up", proximoContatoEm: AGORA, criadoEm: AGORA });
    const resolvido = leadBase({
      id: "resolvido",
      statusComercial: "convertido_cliente",
      temperatura: "quente",
      criadoEm: new Date(AGORA.getTime() - 100 * 60 * 60 * 1000),
    });

    const resultado = calcularOportunidadesComerciais([quente, parado, followUpHoje, resolvido], AGORA);

    expect(resultado.leadsQuentes.map((l) => l.id)).toEqual(["quente"]);
    expect(resultado.leadsParados.map((l) => l.id)).toEqual(["parado"]);
    expect(resultado.followUpsHoje.map((l) => l.id)).toEqual(["follow-up"]);
  });

  it("lista vazia não quebra e retorna tudo vazio", () => {
    const resultado = calcularOportunidadesComerciais([], AGORA);
    expect(resultado).toEqual({ leadsQuentes: [], leadsParados: [], followUpsHoje: [] });
  });
});
