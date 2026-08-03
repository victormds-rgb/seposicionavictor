import { describe, it, expect } from "vitest";
import { calcularHash, dividirEmChunks } from "@/brand_intelligence/domain/chunking";
import { houveMudanca, statusAposFalha } from "@/brand_intelligence/domain/documento-oficial";

describe("calcularHash", () => {
  it("produz o mesmo hash para o mesmo conteúdo (determinístico)", () => {
    expect(calcularHash("texto igual")).toBe(calcularHash("texto igual"));
  });

  it("produz hashes diferentes para conteúdos diferentes", () => {
    expect(calcularHash("texto A")).not.toBe(calcularHash("texto B"));
  });
});

describe("houveMudanca (invariante central da sincronização)", () => {
  it("considera 'mudou' quando nunca foi sincronizado antes (hash null)", () => {
    expect(houveMudanca(null, calcularHash("qualquer coisa"))).toBe(true);
  });

  it("considera 'não mudou' quando o hash é idêntico ao armazenado", () => {
    const hash = calcularHash("mesmo conteúdo");
    expect(houveMudanca(hash, hash)).toBe(false);
  });

  it("considera 'mudou' quando o hash difere do armazenado", () => {
    expect(houveMudanca(calcularHash("versão antiga"), calcularHash("versão nova"))).toBe(true);
  });
});

describe("statusAposFalha (invariante: falha nunca bloqueia, sempre vira 'erro')", () => {
  it("retorna sempre 'erro'", () => {
    expect(statusAposFalha()).toBe("erro");
  });
});

describe("dividirEmChunks", () => {
  it("divide por parágrafos, respeitando o tamanho máximo aproximado", () => {
    const paragrafo = "x".repeat(600);
    const conteudo = `${paragrafo}\n\n${paragrafo}\n\n${paragrafo}`;
    const chunks = dividirEmChunks(conteudo, 1000);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(1000 + paragrafo.length); // tolerância de 1 parágrafo isolado
    }
  });

  it("nunca perde conteúdo — a concatenação dos chunks preserva todos os parágrafos", () => {
    const conteudo = "Parágrafo um.\n\nParágrafo dois.\n\nParágrafo três.";
    const chunks = dividirEmChunks(conteudo, 15); // força múltiplos chunks
    const reconstituido = chunks.join(" ");

    expect(reconstituido).toContain("Parágrafo um.");
    expect(reconstituido).toContain("Parágrafo dois.");
    expect(reconstituido).toContain("Parágrafo três.");
  });

  it("nunca retorna chunk vazio ou só whitespace", () => {
    const conteudo = "Parágrafo real.\n\n\n\n   \n\nOutro parágrafo real.";
    const chunks = dividirEmChunks(conteudo);
    for (const chunk of chunks) {
      expect(chunk.trim().length).toBeGreaterThan(0);
    }
  });
});
