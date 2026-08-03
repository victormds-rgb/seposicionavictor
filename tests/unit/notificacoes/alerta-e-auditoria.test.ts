import { describe, it, expect } from "vitest";
import { podeSerReconhecido, podeSerResolvidoManualmente } from "@/notificacoes/domain/alerta";
import {
  falhouChecklistAutomatizavel,
  calcularPercentualFalha,
  ultrapassouLimiar,
  gerarRecomendacao,
  LIMIAR_FALHA_PERCENTUAL,
} from "@/notificacoes/domain/auditoria-de-drift";

describe("Alerta — invariantes de transição", () => {
  it("permite reconhecer apenas um alerta ativo", () => {
    expect(podeSerReconhecido({ status: "ativo" })).toBe(true);
    expect(podeSerReconhecido({ status: "reconhecido" })).toBe(false);
  });

  it("invariante central: build_log_ausente NUNCA é resolvido manualmente", () => {
    expect(podeSerResolvidoManualmente({ tipo: "build_log_ausente", status: "ativo" })).toBe(false);
    expect(podeSerResolvidoManualmente({ tipo: "build_log_ausente", status: "reconhecido" })).toBe(
      false
    );
  });

  it("permite resolver manualmente os outros dois tipos de alerta", () => {
    expect(podeSerResolvidoManualmente({ tipo: "desvio_pilares", status: "ativo" })).toBe(true);
    expect(podeSerResolvidoManualmente({ tipo: "auditoria_devida", status: "reconhecido" })).toBe(
      true
    );
  });
});

describe("AuditoriaDeDrift — checklist automatizável (proxy do SOM Cap. 1.8/2.7)", () => {
  const fraseAncora = "Ninguém cresce enquanto acredita na própria desculpa.";

  it("falha quando o texto repete literalmente a frase-âncora (Cap. 2.7 — vira jargão vazio)", () => {
    expect(
      falhouChecklistAutomatizavel(
        {
          id: "1",
          conteudoTexto: `Como sempre digo: ${fraseAncora}`,
          origemTipo: "case",
          temaId: "algum-tema",
          frameworkId: null,
        },
        fraseAncora
      )
    ).toBe(true);
  });

  it("falha quando a peça é autônoma sem tema nem framework (sem lente reconhecível)", () => {
    expect(
      falhouChecklistAutomatizavel(
        { id: "2", conteudoTexto: "Texto qualquer sem estrutura.", origemTipo: "autonomo", temaId: null, frameworkId: null },
        fraseAncora
      )
    ).toBe(true);
  });

  it("não falha quando a peça tem origem em Case, mesmo sem tema/framework (já tem lente via prova)", () => {
    expect(
      falhouChecklistAutomatizavel(
        { id: "3", conteudoTexto: "Case real documentado.", origemTipo: "case", temaId: null, frameworkId: null },
        fraseAncora
      )
    ).toBe(false);
  });

  it("não falha quando a peça autônoma tem tema OU framework associado", () => {
    expect(
      falhouChecklistAutomatizavel(
        { id: "4", conteudoTexto: "Reflexão com lente.", origemTipo: "autonomo", temaId: "tema-x", frameworkId: null },
        fraseAncora
      )
    ).toBe(false);
  });
});

describe("calcularPercentualFalha / ultrapassouLimiar / gerarRecomendacao", () => {
  it("calcula o percentual corretamente", () => {
    expect(calcularPercentualFalha(6, 20)).toBe(30);
    expect(calcularPercentualFalha(0, 20)).toBe(0);
    expect(calcularPercentualFalha(0, 0)).toBe(0);
  });

  it("o limiar é exatamente 30% (DATABASE.md, Decisão de Engenharia já registrada)", () => {
    expect(LIMIAR_FALHA_PERCENTUAL).toBe(30);
    expect(ultrapassouLimiar(30)).toBe(false); // "ultrapassar" é estritamente maior que
    expect(ultrapassouLimiar(31)).toBe(true);
  });

  it("nunca gera recomendação quando dentro do limiar", () => {
    expect(gerarRecomendacao(25)).toBeNull();
  });

  it("gera recomendação de PAUSA E REVISÃO, nunca de ação automática, quando ultrapassa o limiar", () => {
    const recomendacao = gerarRecomendacao(40);
    expect(recomendacao).toContain("pausar produção nova e revisar o Fundamento");
    expect(recomendacao).toContain("nenhuma ação automática foi tomada");
  });
});
