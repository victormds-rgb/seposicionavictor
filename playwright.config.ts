import { defineConfig, devices } from "@playwright/test";
import { STORAGE_STATE_PATH } from "./tests/e2e/fixtures/storage-state";

// `npx playwright test` não carrega .env.local sozinho (diferente de
// `next dev`, que carrega automaticamente) — sem isso, E2E_USER_EMAIL/
// E2E_USER_PASSWORD nunca chegam a auth.setup.ts. process.loadEnvFile é
// nativo do Node (20.6+), sem dependência nova. Ignora silenciosamente
// se o arquivo não existir (ex.: CI injetando env vars por outro meio).
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local ausente — segue com o que já estiver em process.env.
}

// Sprint 11 — Testes E2E.
// Três projetos: "setup" autentica uma vez (auth.setup.ts) e salva a
// sessão; "auth-flow" roda o spec de Autenticação com contexto limpo
// (precisa começar deslogado); "authenticated" roda os demais 6
// fluxos reaproveitando a sessão do "setup" — evita logar via UI a
// cada spec, mantendo cada teste independente (cada um cria seus
// próprios dados, nenhum depende de outro ter rodado antes).
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  // Timeouts elevados acima do padrão do Playwright (5s/30s) — medidos
  // via /health contra o Postgres/Supabase Auth reais deste projeto
  // (após aquecido: ~50-300ms; na primeira conexão do processo,
  // observado até ~6s). Some a isso a compilação sob demanda de rotas
  // em `next dev` na primeira vez que cada uma é acessada (observado
  // até ~9-10s por rota) — o teste "setup" é sempre o primeiro a bater
  // em /login → / → /dashboard num servidor recém-subido, encadeando
  // 3 compilações + round-trips reais. Não é lentidão da aplicação em
  // produção — é custo de dev-mode a frio + rede real (Sprint 13 — Boot).
  timeout: 90_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: "http://localhost:3003",
    trace: "on-first-retry",
    navigationTimeout: 30_000,
    actionTimeout: 20_000,
  },
  webServer: {
    command: "npm run dev -- --port 3003",
    url: "http://localhost:3003",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "auth-flow",
      testMatch: /auth\/autenticacao\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "authenticated",
      testIgnore: [/auth\.setup\.ts/, /auth\/autenticacao\.spec\.ts/],
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE_PATH },
      dependencies: ["setup"],
    },
  ],
});
