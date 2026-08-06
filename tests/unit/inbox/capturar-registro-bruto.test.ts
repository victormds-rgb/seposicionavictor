import { describe, it, expect } from "vitest";
import { capturarRegistroBruto } from "@/inbox/application/capturar-registro-bruto";
import { FakeRegistroBrutoRepository } from "./_fakes/fake-registro-bruto-repository";
import { FakePortaDeArmazenamentoBinario } from "./_fakes/fake-porta-de-armazenamento";
import { FakePortaDeIA } from "../ia/_fakes/fake-porta-de-ia";
import { FakeSugestaoIARepository } from "../ia/_fakes/fake-sugestao-ia-repository";

/**
 * Regressão — Sprint 22 (UX_REPORT.md): capturar texto na Inbox não
 * pode derrubar a página inteira quando a classificação automática
 * por IA falha (ex.: OPENROUTER_API_KEY ausente em produção). A
 * captura em si já persistiu com sucesso antes da classificação
 * rodar — isso precisa valer mesmo se a IA falhar.
 */
describe("capturarRegistroBruto — degradação graciosa quando a IA falha", () => {
  function montarDeps() {
    return {
      registroBrutoRepository: new FakeRegistroBrutoRepository(),
      portaDeArmazenamento: new FakePortaDeArmazenamentoBinario(),
      portaDeIA: {
        async classificarRegistroBruto(): Promise<never> {
          throw new Error("OPENROUTER_API_KEY não configurada — não é possível classificar via OpenRouter.");
        },
      },
      sugestaoIARepository: new FakeSugestaoIARepository(),
    };
  }

  it("mantém o registro como 'capturado' em vez de propagar o erro da IA", async () => {
    const deps = montarDeps();

    const registro = await capturarRegistroBruto(
      { tipoEntrada: "texto", origem: "ideia", conteudoTexto: "Ideia para o próximo conteúdo." },
      deps
    );

    expect(registro.status).toBe("capturado");
    expect(deps.registroBrutoRepository.registros.size).toBe(1);
  });

  it("captura com IA funcionando normalmente continua classificando (comportamento inalterado)", async () => {
    const deps = { ...montarDeps(), portaDeIA: new FakePortaDeIA() };

    const registro = await capturarRegistroBruto(
      { tipoEntrada: "texto", origem: "ideia", conteudoTexto: "Ideia para o próximo conteúdo." },
      deps
    );

    expect(registro.status).toBe("classificacao_sugerida");
  });
});
