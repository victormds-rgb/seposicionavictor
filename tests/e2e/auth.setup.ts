import { test as setup, expect } from "@playwright/test";
import { STORAGE_STATE_PATH } from "./fixtures/storage-state";

/**
 * Projeto "setup" do Playwright (playwright.config.ts) — roda uma vez
 * antes dos specs autenticados e salva a sessão em STORAGE_STATE_PATH,
 * reutilizada por eles via `use: { storageState }`. O spec de
 * Autenticação (auth/autenticacao.spec.ts) roda em um projeto próprio,
 * sem essa sessão, porque precisa exercitar o login do zero.
 *
 * Exige um usuário real do Supabase Auth do projeto — a suíte nunca
 * inventa credenciais. Configure em `.env.local` (lido pelo `next dev`
 * que o `webServer` do Playwright sobe) e nas variáveis de ambiente do
 * processo que roda `npx playwright test`:
 *   E2E_USER_EMAIL=...
 *   E2E_USER_PASSWORD=...
 */
setup("autenticar uma vez e reutilizar a sessão nos specs autenticados", async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_USER_EMAIL e/ou E2E_USER_PASSWORD não configuradas. A suíte E2E precisa de um " +
        "usuário real do Supabase Auth do projeto (criado manualmente) — nenhuma credencial é " +
        "inventada pelos testes. Ver README.md / relatório da Sprint 11."
    );
  }

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL("/dashboard");

  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
