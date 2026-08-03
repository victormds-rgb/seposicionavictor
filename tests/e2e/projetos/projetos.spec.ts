import { test, expect } from "@playwright/test";
import { sufixoUnico } from "../fixtures/unique";

/**
 * Fluxo 5 — Projetos (Sprint 11).
 *
 * Criar Projeto → preencher critérios (os 6 campos do formato de case,
 * SOM Cap. 5.1) → o Projeto transiciona automaticamente para
 * `pronto_para_case` assim que os 6 campos ficam completos (não existe
 * botão "marcar pronto" — é consequência direta do preenchimento,
 * `podeTransicionarParaProntoParaCase`) → criar Case a partir dele.
 *
 * Usa tipo `produto_proprio` para não depender de um Cliente
 * pré-existente (`cliente_externo` exige `clienteId` válido na
 * criação — fora do escopo deste fluxo).
 */
test.describe("Projetos", () => {
  test("criar Projeto → preencher critérios → pronto para Case → criar Case", async ({ page }) => {
    const nome = `Projeto E2E ${sufixoUnico()}`;

    await page.goto("/projetos");

    const novoProjeto = page.getByRole("region", { name: "Novo Projeto" });
    await novoProjeto.getByLabel("Nome").fill(nome);
    await novoProjeto.getByLabel("Tipo").selectOption("produto_proprio");
    await novoProjeto.getByLabel(/Desculpa inicial/).fill("Achávamos que o produto falava por si.");
    await novoProjeto.getByLabel(/Custo mensal/).fill("500");
    await novoProjeto.getByRole("button", { name: "Criar Projeto" }).click();

    const projeto = page.getByRole("listitem").filter({ hasText: nome });
    await expect(projeto).toBeVisible();
    await expect(projeto.getByText("em preenchimento")).toBeVisible();

    await projeto.getByLabel("Momento da quebra").fill("Percebemos zero conversão orgânica.");
    await projeto.getByLabel("Solução").fill("Case público + prova social ativa.");
    await projeto.getByLabel("Tempo").fill("3 semanas");
    await projeto.getByLabel("Número (resultado)").fill("18 leads qualificados");
    await projeto.getByRole("button", { name: "Atualizar campos de case" }).click();

    await expect(projeto.getByText(/\bpronto_para_case\b/)).toBeVisible();
    await expect(projeto.getByText("completo")).toBeVisible();

    await projeto.getByRole("button", { name: "Criar Case a partir deste Projeto" }).click();

    await expect(projeto.getByRole("heading", { name: "Case" })).toBeVisible();
    await expect(projeto.getByText(/Status: (incompleto|completo)/)).toBeVisible();
  });
});
