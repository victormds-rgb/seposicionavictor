import { execFileSync } from "node:child_process";
import { test, expect, type Page } from "@playwright/test";

/**
 * Fluxo 7 — Notificações (Sprint 11; fonte de verdade da contagem
 * trocada no Checkpoint G — Redesign do Dashboard).
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
 * Checkpoint G: o Dashboard passou a fazer CURADORIA dos Alertas (só
 * os 3 mais antigos aparecem no bloco "Atenção") — contar `listitem`
 * nesse widget não reflete mais o total real, e nunca vai refletir
 * (sempre há um próximo alerta pronto para preencher a vaga enquanto
 * houver mais de 3 ativos). A contagem exata e completa agora só
 * existe no badge do topbar (`PainelAlertas`) — nova regra definida
 * junto com a aprovação do Checkpoint G: TOPBAR = quantidade total
 * real; DASHBOARD = curadoria; `/alertas` = visão completa.
 */
async function contarAlertasNoTopbar(page: Page): Promise<number> {
  const sino = page.getByRole("button", { name: /Alertas ativos \(\d+\)/ });
  const rotulo = await sino.getAttribute("aria-label");
  const match = rotulo?.match(/\((\d+)\)/);
  return match ? Number(match[1]) : 0;
}

test.describe("Notificações", () => {
  test("Job gera alerta → topbar mostra o total → resolver → total cai em 1", async ({ page }) => {
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
    await expect(page.getByRole("heading", { name: "Atenção" })).toBeVisible();
    const totalAntes = await contarAlertasNoTopbar(page);

    await page.goto("/alertas");

    const resolviveis = () =>
      page
        .getByRole("listitem")
        .filter({ hasText: "ativo" })
        .filter({ hasNot: page.getByText("build_log_ausente") });

    const totalResolviveisAntes = await resolviveis().count();

    test.skip(
      totalResolviveisAntes === 0,
      "Nenhum alerta ativo resolvível manualmente foi gerado pelo Job neste estado do banco " +
        "(ex.: já existe uma AuditoriaDeDrift recente e nenhum desvio de pilares) — cenário " +
        "depende do estado real dos dados, não é reproduzível de forma 100% determinística via UI."
    );

    await resolviveis().first().getByRole("button", { name: "Resolver" }).click();

    await expect(resolviveis()).toHaveCount(totalResolviveisAntes - 1);

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Atenção" })).toBeVisible();
    await expect.poll(() => contarAlertasNoTopbar(page)).toBe(totalAntes - 1);
  });
});
