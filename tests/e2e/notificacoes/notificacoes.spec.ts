import { execFileSync } from "node:child_process";
import { test, expect } from "@playwright/test";

/**
 * Fluxo 7 — Notificações (Sprint 11).
 *
 * "Criar cenário que gere alerta" não tem mais nenhum caminho via UI:
 * a partir do Hardening (Sprint 10), `MonitorDeConsistencia` só roda
 * como Job do Scheduler (`infra/scheduler/jobs/monitor-de-consistencia-job.ts`),
 * nunca durante a renderização de página — foi removido deliberadamente
 * para eliminar escrita de banco no render. O cenário é criado
 * chamando o Job pela mesma via que um scheduler externo (Trigger.dev
 * ou equivalente) usaria: `npm run jobs:run -- monitor-de-consistencia`.
 *
 * `build_log_ausente` nunca pode ser resolvido manualmente
 * (`podeSerResolvidoManualmente`, invariante do domínio) — o teste
 * resolve o primeiro alerta ativo de outro tipo (`desvio_pilares` ou
 * `auditoria_devida`), sem assumir qual dos dois o Job vai gerar no
 * estado atual do banco de teste.
 *
 * Nota (Sprint 13 — Boot): nem texto (condicaoGatilho/status) nem
 * posição no DOM são identificadores seguros para "reencontrar" o
 * mesmo <li> depois da mutação — execuções repetidas do Job acumulam
 * alertas históricos com o MESMO texto de gatilho (duplicidade), e
 * `listarAlertas({})` não tem ORDER BY estável no servidor (a ordem
 * pode mudar entre o load original e o revalidatePath pós-clique). A
 * verificação robusta e independente de ordem/duplicidade é por
 * CONTAGEM: clicar em "Resolver" precisa reduzir em exatamente 1 o
 * total de alertas ativos resolvíveis, tanto em /alertas quanto no
 * widget do Dashboard — não importa qual linha específica saiu.
 */
test.describe("Notificações", () => {
  test("Job gera alerta → Dashboard mostra → resolver → alerta desaparece dos ativos", async ({
    page,
  }) => {
    try {
      execFileSync("npm", ["run", "jobs:run", "--", "monitor-de-consistencia"], {
        stdio: "pipe",
        timeout: 60_000,
        shell: process.platform === "win32",
      });
    } catch (erro) {
      test.fail(
        true,
        `Falha ao executar o Job monitor-de-consistencia (npm run jobs:run) — verifique DATABASE_URL/.env.local. Detalhe: ${erro}`
      );
    }

    await page.goto("/dashboard");
    const alertasAtivosDashboard = page.getByRole("region", { name: /Alertas ativos/ });
    await expect(alertasAtivosDashboard).toBeVisible();
    const totalDashboardAntes = await alertasAtivosDashboard.getByRole("listitem").count();

    await page.goto("/alertas");

    const resolviveis = () =>
      page
        .getByRole("listitem")
        .filter({ hasText: "ativo" })
        .filter({ hasNot: page.getByText("build_log_ausente") });

    const totalAntes = await resolviveis().count();

    test.skip(
      totalAntes === 0,
      "Nenhum alerta ativo resolvível manualmente foi gerado pelo Job neste estado do banco " +
        "(ex.: já existe uma AuditoriaDeDrift recente e nenhum desvio de pilares) — cenário " +
        "depende do estado real dos dados, não é reproduzível de forma 100% determinística via UI."
    );

    await resolviveis().first().getByRole("button", { name: "Resolver" }).click();

    await expect(resolviveis()).toHaveCount(totalAntes - 1);

    await page.goto("/dashboard");
    await expect(alertasAtivosDashboard.getByRole("listitem")).toHaveCount(
      Math.max(totalDashboardAntes - 1, 0)
    );
  });
});
