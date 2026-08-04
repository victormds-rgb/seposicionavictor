import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    // Sprint 15 — Green Deploy: tests/integration/** batem num Postgres
    // real (sem mocks) e alguns encadeiam ~20+ operações sequenciais
    // (ex.: AuditoriaDeDrift) — o padrão de 5000ms do Vitest estourava
    // por pura latência de rede, não por bug. `fileParallelism: false`
    // porque os arquivos de integração compartilham o mesmo banco real
    // (sem isolamento por worker); rodando em paralelo, testes que leem
    // agregados globais (ex.: distribuição de pilares) competiam entre
    // si e falhavam por corrida de dados, não por lógica incorreta.
    testTimeout: 20_000,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@infra": path.resolve(__dirname, "./infra"),
      "@config": path.resolve(__dirname, "./config"),
    },
  },
});
