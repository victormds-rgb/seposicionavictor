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

    await page.goto("/conteudo");

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

    await peca.getByRole("button", { name: "Avançar etapa" }).click();
    await expect(peca.getByText(/\bem_revisao\b/)).toBeVisible();

    await peca.getByRole("button", { name: "Avançar etapa" }).click();
    await expect(peca.getByText(/\bagendado\b/)).toBeVisible();

    await peca.getByRole("button", { name: "Avançar etapa" }).click();
    await expect(peca.getByText(/\bpublicado\b/)).toBeVisible();
  });
});
