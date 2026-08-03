import { describe, it, expect } from "vitest";
import {
  comprimentoDoCanal,
  derivacaoValida,
  podePublicar,
} from "@/conteudo/domain/peca-de-conteudo";
import { somaDosPesosAlvoValida, PILARES_SOM } from "@/conteudo/domain/pilar";

describe("derivacaoValida (invariante SOM Cap. 9.8 — nunca mais curta origina mais longa)", () => {
  it("newsletter (longo) pode derivar para x (curto)", () => {
    expect(derivacaoValida("newsletter", "x")).toBe(true);
  });

  it("youtube (longo) pode derivar para linkedin (médio)", () => {
    expect(derivacaoValida("youtube", "linkedin")).toBe(true);
  });

  it("nunca permite que x (curto) derive para newsletter (longo) — o inverso proibido", () => {
    expect(derivacaoValida("x", "newsletter")).toBe(false);
  });

  it("nunca permite derivação entre canais de mesmo comprimento", () => {
    expect(derivacaoValida("linkedin", "instagram")).toBe(false);
    expect(derivacaoValida("newsletter", "youtube")).toBe(false);
  });

  it("a escala de comprimento é consistente com os exemplos do DATABASE.md (newsletter/vídeo longos, x curto)", () => {
    expect(comprimentoDoCanal("newsletter")).toBeGreaterThan(comprimentoDoCanal("x"));
    expect(comprimentoDoCanal("youtube")).toBeGreaterThan(comprimentoDoCanal("x"));
  });
});

describe("podePublicar (invariante: toda peça publicada tem Pilar atribuído)", () => {
  it("permite publicar quando há pilarId e status é anterior a publicado", () => {
    expect(podePublicar({ status: "agendado", pilarId: "algum-id" })).toBe(true);
  });

  it("nunca permite publicar novamente uma peça já publicada", () => {
    expect(podePublicar({ status: "publicado", pilarId: "algum-id" })).toBe(false);
  });
});

describe("Pilares do SOM Cap. 9.1", () => {
  it("a soma dos 5 pesos-alvo é exatamente 100%", () => {
    expect(somaDosPesosAlvoValida(PILARES_SOM)).toBe(true);
    expect(PILARES_SOM).toHaveLength(5);
  });
});
