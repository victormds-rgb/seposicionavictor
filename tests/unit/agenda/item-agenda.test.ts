import { describe, it, expect } from "vitest";
import {
  podeSerConcluido,
  podeSerMarcadoComoPerdido,
  ehItemDeRotinaFixaValido,
  ROTINA_SEMANAL_FIXA,
} from "@/agenda/domain/item-agenda";

describe("podeSerConcluido", () => {
  it("permite concluir apenas itens agendados", () => {
    expect(podeSerConcluido({ status: "agendado" })).toBe(true);
    expect(podeSerConcluido({ status: "concluido" })).toBe(false);
    expect(podeSerConcluido({ status: "perdido" })).toBe(false);
  });
});

describe("podeSerMarcadoComoPerdido (notificação básica de ausência)", () => {
  const agora = new Date("2026-07-29T12:00:00Z");

  it("marca como perdido apenas se ainda agendado E já passou do horário", () => {
    const passado = new Date("2026-07-29T10:00:00Z");
    expect(podeSerMarcadoComoPerdido({ status: "agendado", dataHora: passado }, agora)).toBe(true);
  });

  it("nunca marca como perdido um item que ainda está no futuro", () => {
    const futuro = new Date("2026-07-29T14:00:00Z");
    expect(podeSerMarcadoComoPerdido({ status: "agendado", dataHora: futuro }, agora)).toBe(false);
  });

  it("nunca marca como perdido um item já concluído, mesmo que atrasado", () => {
    const passado = new Date("2026-07-29T10:00:00Z");
    expect(podeSerMarcadoComoPerdido({ status: "concluido", dataHora: passado }, agora)).toBe(
      false
    );
  });
});

describe("ehItemDeRotinaFixaValido (invariante: rotina_fixa sempre referencia dia/atividade do SOM)", () => {
  it("aceita qualquer referência que não seja rotina_fixa sem exigir o campo", () => {
    expect(ehItemDeRotinaFixaValido({ tipo: "reuniao", rotinaFixaReferencia: null })).toBe(true);
  });

  it("exige referência válida (uma das 5 atividades do SOM Cap. 9.4) quando tipo é rotina_fixa", () => {
    expect(ehItemDeRotinaFixaValido({ tipo: "rotina_fixa", rotinaFixaReferencia: null })).toBe(
      false
    );
    expect(
      ehItemDeRotinaFixaValido({ tipo: "rotina_fixa", rotinaFixaReferencia: "referencia_invalida" })
    ).toBe(false);
    expect(
      ehItemDeRotinaFixaValido({
        tipo: "rotina_fixa",
        rotinaFixaReferencia: ROTINA_SEMANAL_FIXA[0].referencia,
      })
    ).toBe(true);
  });

  it("a rotina semanal fixa tem exatamente 5 atividades (segunda a sexta, SOM Cap. 9.4)", () => {
    expect(ROTINA_SEMANAL_FIXA).toHaveLength(5);
    expect(ROTINA_SEMANAL_FIXA.map((r) => r.diaSemana)).toEqual([1, 2, 3, 4, 5]);
  });
});
