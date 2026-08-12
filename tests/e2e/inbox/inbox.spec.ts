import { test, expect } from "@playwright/test";
import { sufixoUnico } from "../fixtures/unique";

/**
 * Fluxo 2 — Inbox (Sprint 11; modo fake de IA adicionado na Sprint 12).
 *
 * Captura texto → IA gera sugestão → aceitar → sugestão sai da fila de
 * revisão → evento registrado. `capturarRegistroBruto` classifica
 * automaticamente qualquer entrada textual via `PortaDeIA`. Fora de
 * produção (`next dev`, que é o que o `webServer` do Playwright usa),
 * sem `OPENAI_API_KEY` configurada o sistema cai automaticamente
 * em `FakeLocalPortaDeIA` (src/inbox/infrastructure/composicao.ts) —
 * o teste não precisa mais pular nem consumir a API real da OpenAI.
 * Nenhuma asserção depende do texto exato da justificativa, então o
 * mesmo teste passa com o provider real OU o fake.
 *
 * Nota (Sprint 13 — Boot): aceitar NÃO remove o registro da Inbox —
 * a página lista todos os status por padrão (confirmado contra a
 * aplicação real). O que desaparece é a seção de sugestão pendente; o
 * registro permanece, agora com status `classificado`.
 */
test.describe("Inbox", () => {
  test("capturar texto → IA sugere → aceitar → sugestão sai da fila de revisão", async ({
    page,
  }) => {
    const conteudo = `Registro E2E ${sufixoUnico()} — aprendizado sobre precificação de serviço.`;

    await page.goto("/inbox");

    // Sprint de UX/UI (Fase 5): as regiões "Capturar (texto)" e
    // "Capturar (arquivo)" foram fundidas em uma única região com
    // abas — o modo "Texto" é o padrão ao carregar a página.
    const capturarTexto = page.getByRole("region", { name: "Capturar nova entrada" });
    await capturarTexto.getByLabel("Conteúdo").fill(conteudo);
    await capturarTexto.getByRole("button", { name: "Capturar entrada" }).click();

    const item = page.getByRole("listitem").filter({ hasText: conteudo });
    await expect(item).toBeVisible();

    // Classificação é síncrona dentro do próprio Server Action — a
    // sugestão já deve estar presente assim que a página re-renderiza;
    // o `expect` com auto-retry cobre qualquer latência de rede real.
    await expect(item.getByText("IA sugere:")).toBeVisible();

    await item.getByRole("button", { name: "Aceitar" }).click();

    // O registro continua na lista (a Inbox não filtra por status por
    // padrão) — o que muda é a transição de estado: some a sugestão
    // pendente e o status passa a `classificado`. `ROTULOS_STATUS_REGISTRO`
    // exibe o rótulo capitalizado ("Classificado"), daí o flag `i`.
    await expect(item.getByText("IA sugere:")).toHaveCount(0);
    await expect(item.getByText(/\bclassificado\b/i)).toBeVisible();
  });

  test("rejeitar sugestão mantém o registro na Inbox, aguardando nova classificação", async ({
    page,
  }) => {
    const conteudo = `Registro E2E ${sufixoUnico()} — nota solta sem contexto claro.`;

    await page.goto("/inbox");
    const capturarTexto = page.getByRole("region", { name: "Capturar nova entrada" });
    await capturarTexto.getByLabel("Conteúdo").fill(conteudo);
    await capturarTexto.getByRole("button", { name: "Capturar entrada" }).click();

    const item = page.getByRole("listitem").filter({ hasText: conteudo });
    await expect(item.getByText("IA sugere:")).toBeVisible();

    await item.getByRole("button", { name: "Rejeitar" }).click();

    await expect(item).toBeVisible();
    await expect(item.getByRole("button", { name: "Solicitar nova sugestão" })).toBeVisible();
  });
});
