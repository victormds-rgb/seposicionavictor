import { test, expect } from "@playwright/test";
import { sufixoUnico } from "../fixtures/unique";

/**
 * Fluxo 6 — Conteúdo (Sprint 11).
 *
 * Criar Peça (rascunho) → avançar para revisão → agendar → publicar.
 * `avancarStatusDaPeca` percorre rascunho→em_revisão→agendado, e a
 * chamada seguinte já publica (delega para `publicarPeca` quando a
 * próxima etapa é "publicado") — três cliques em "Avançar etapa"
 * cobrem exatamente os 4 passos do fluxo pedido.
 *
 * Depende de haver Pilares cadastrados (Reference Data, `npm run
 * db:seed`) — sem isso, o `<select>` de Pilar fica vazio e a criação
 * falha na validação `required`.
 */
test.describe("Conteúdo", () => {
  test("criar Peça → enviar para revisão → agendar → publicar", async ({ page }) => {
    const conteudoTexto = `Peça E2E ${sufixoUnico()} — reflexão sobre diagnóstico antes da ferramenta.`;

    // Medido empiricamente (Sprint de UX/UI — Fechamento): primeira
    // compilação a frio desta rota no `next dev`/Turbopack chega a
    // ~13,8s (contra ~950ms já compilada) — mesmo custo de dev-mode já
    // documentado em playwright.config.ts, ampliado pelo peso visual
    // novo desta página. Sem erro de compilação real por trás disso.
    await page.goto("/conteudo", { timeout: 45_000 });

    const novaPeca = page.getByRole("region", { name: "Nova Peça (autônoma)" });
    await novaPeca.getByLabel("Canal").selectOption("linkedin");
    await expect(
      novaPeca.getByLabel("Pilar").locator("option"),
      "Pilares (Reference Data) precisam estar semeados — ver npm run db:seed."
    ).not.toHaveCount(0);
    await novaPeca.getByLabel("Pilar").selectOption({ index: 0 });
    await novaPeca.getByLabel("Conteúdo").fill(conteudoTexto);
    await novaPeca.getByRole("button", { name: "Criar" }).click();

    const peca = page.getByRole("listitem").filter({ hasText: conteudoTexto });
    await expect(peca).toBeVisible();
    await expect(peca.getByText(/\brascunho\b/)).toBeVisible();

    // ROTULOS_STATUS_PECA (Sprint 33.5) traduz "em_revisao" para o
    // texto exibido ao usuário; os demais status (rascunho/agendado/
    // publicado) não têm tradução e continuam crus.
    await peca.getByRole("button", { name: "Avançar etapa" }).click();
    await expect(peca.getByText("Em revisão")).toBeVisible();

    await peca.getByRole("button", { name: "Avançar etapa" }).click();
    await expect(peca.getByText(/\bagendado\b/)).toBeVisible();

    await peca.getByRole("button", { name: "Avançar etapa" }).click();
    await expect(peca.getByText(/\bpublicado\b/)).toBeVisible();
  });
});
