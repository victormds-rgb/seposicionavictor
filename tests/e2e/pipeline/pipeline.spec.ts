import { test, expect } from "@playwright/test";
import { sufixoUnico } from "../fixtures/unique";
import { dataHoraLocalDaquiA } from "../fixtures/datas";

/**
 * Fluxo 4 — Pipeline Comercial (Sprint 11).
 *
 * Lead → Qualificação → Agendamento → confirmar reunião → Conversão
 * em Cliente (árvore de decisão do SOM Cap. 7.1). Sem dependência
 * externa real: `agendarComercial` não chama a API do Google Calendar
 * nesta fase (ARCHITECTURE.md, seção 19 — `googleCalendarEventId`
 * fica `null` quando não fornecido, sem bloquear o fluxo).
 */
test.describe("Pipeline Comercial", () => {
  test("criar Lead → qualificar → agendar → converter em Cliente", async ({ page }) => {
    const nome = `Lead E2E ${sufixoUnico()}`;

    await page.goto("/pipeline");

    const novoLead = page.getByRole("region", { name: "Novo Lead" });
    await novoLead.getByLabel("Nome").fill(nome);
    await novoLead.getByLabel("Origem").fill("indicação");
    await novoLead.getByRole("button", { name: "Criar Lead" }).click();

    const lead = page.getByRole("listitem").filter({ hasText: nome });
    await expect(lead).toBeVisible();
    await expect(lead.getByText("novo")).toBeVisible();

    await lead.getByLabel("Resumo da qualificação").fill("Dor clara em geração de leads.");
    await lead.getByLabel("Próximo passo").fill("Agendar reunião de diagnóstico.");
    await lead.getByRole("button", { name: "Registrar qualificação" }).click();

    await expect(lead.getByText("qualificado")).toBeVisible();

    await lead.getByLabel("Data e hora da reunião").fill(dataHoraLocalDaquiA(120));
    await lead.getByRole("button", { name: "Agendar (cria reunião na Agenda)" }).click();

    await expect(lead.getByText("agendado")).toBeVisible();

    await lead.getByRole("button", { name: "Confirmar que a reunião aconteceu" }).click();

    await expect(lead.getByText("reunido")).toBeVisible();

    await lead.getByLabel("Nome do cliente").fill(nome);
    await lead.getByLabel("Setor").fill("Serviços");
    await lead.locator('input[name="temAutoridadeReal"][value="sim"]').check();
    await lead.locator('input[name="aceitaDiagnostico"][value="sim"]').check();
    await lead.locator('input[name="sinalNaoCumprimento"][value="nao"]').check();
    await lead.getByRole("button", { name: "Converter em Cliente" }).click();

    await expect(lead.getByText("convertido_cliente")).toBeVisible();

    await page.goto("/clientes");
    await expect(page.getByRole("listitem").filter({ hasText: nome })).toBeVisible();
  });
});
