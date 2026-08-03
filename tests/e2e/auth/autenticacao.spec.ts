import { test, expect } from "@playwright/test";

/**
 * Fluxo 1 — Autenticação (Sprint 11).
 *
 * Roda no projeto "auth-flow" (playwright.config.ts), sem sessão
 * pré-carregada — precisa começar deslogado para exercitar o
 * middleware de autenticação de verdade (src/middleware.ts).
 */
test.describe("Autenticação", () => {
  test("acessar rota protegida sem sessão redireciona para /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("credenciais inválidas permanecem em /login com mensagem de erro", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("nao-existe-e2e@example.com");
    await page.getByLabel("Senha").fill("senha-incorreta-123");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/login\?erro=/);
    // `getByRole("alert")` bate também com o route announcer que o
    // Next.js injeta automaticamente em toda página
    // (`#__next-route-announcer__`) — mirando especificamente no
    // `<p role="alert">` que a própria página de login renderiza.
    await expect(page.locator('p[role="alert"]')).toBeVisible();
  });

  test("autenticar com credenciais válidas dá acesso ao Dashboard", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(
      !email || !password,
      "E2E_USER_EMAIL/E2E_USER_PASSWORD não configuradas — ver auth.setup.ts."
    );

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email!);
    await page.getByLabel("Senha").fill(password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });
});
