import { describe, it, expect } from "vitest";
import { avaliarCliente } from "@/clientes/domain/regra-de-decisao-cliente";
import { classificacaoConsistenteComSinal } from "@/clientes/domain/cliente";

describe("avaliarCliente — árvore de decisão do SOM, Cap. 7.1 (todas as 8 combinações)", () => {
  it("sem autoridade real → cliente_de_caixa, independente das demais respostas", () => {
    expect(
      avaliarCliente({ temAutoridadeReal: false, aceitaDiagnostico: true, sinalNaoCumprimento: true })
    ).toBe("cliente_de_caixa");
    expect(
      avaliarCliente({ temAutoridadeReal: false, aceitaDiagnostico: false, sinalNaoCumprimento: false })
    ).toBe("cliente_de_caixa");
  });

  it("com autoridade real mas sem aceitar diagnóstico → cliente_de_caixa, independente do sinal", () => {
    expect(
      avaliarCliente({ temAutoridadeReal: true, aceitaDiagnostico: false, sinalNaoCumprimento: true })
    ).toBe("cliente_de_caixa");
    expect(
      avaliarCliente({ temAutoridadeReal: true, aceitaDiagnostico: false, sinalNaoCumprimento: false })
    ).toBe("cliente_de_caixa");
  });

  it("com autoridade real e aceita diagnóstico e HÁ sinal de não cumprimento → exigir_contrato_reforcado", () => {
    expect(
      avaliarCliente({ temAutoridadeReal: true, aceitaDiagnostico: true, sinalNaoCumprimento: true })
    ).toBe("exigir_contrato_reforcado");
  });

  it("com autoridade real e aceita diagnóstico e SEM sinal de não cumprimento → prioridade_alta", () => {
    expect(
      avaliarCliente({ temAutoridadeReal: true, aceitaDiagnostico: true, sinalNaoCumprimento: false })
    ).toBe("prioridade_alta");
  });
});

describe("classificacaoConsistenteComSinal — invariante escopada corretamente ao ramo da árvore", () => {
  it("não exige contrato reforçado quando a árvore nem chegou a perguntar sobre o sinal (sem autoridade)", () => {
    expect(
      classificacaoConsistenteComSinal(
        { temAutoridadeReal: false, aceitaDiagnostico: true, sinalNaoCumprimento: true },
        "cliente_de_caixa"
      )
    ).toBe(true);
  });

  it("não exige contrato reforçado quando a árvore nem chegou a perguntar sobre o sinal (não aceita diagnóstico)", () => {
    expect(
      classificacaoConsistenteComSinal(
        { temAutoridadeReal: true, aceitaDiagnostico: false, sinalNaoCumprimento: true },
        "cliente_de_caixa"
      )
    ).toBe(true);
  });

  it("exige exigir_contrato_reforcado quando a árvore chegou a perguntar e o sinal é verdadeiro", () => {
    expect(
      classificacaoConsistenteComSinal(
        { temAutoridadeReal: true, aceitaDiagnostico: true, sinalNaoCumprimento: true },
        "exigir_contrato_reforcado"
      )
    ).toBe(true);
    expect(
      classificacaoConsistenteComSinal(
        { temAutoridadeReal: true, aceitaDiagnostico: true, sinalNaoCumprimento: true },
        "prioridade_alta"
      )
    ).toBe(false);
  });
});
