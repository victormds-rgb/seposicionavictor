import { test, expect } from "@playwright/test";
import { sufixoUnico } from "../fixtures/unique";
import { dataHoraLocalDaquiA } from "../fixtures/datas";

/**
 * Fluxo 3 — Agenda (Sprint 11; modo fake de IA adicionado na Sprint 12).
 *
 * Dividido em dois testes: o primeiro (criar → visualizar → marcar
 * como realizada) não depende de nenhum serviço externo. O segundo
 * (registro bruto associado) precisa que a captura textual seja
 * classificada, pois a invariante "Reuniao só é processada com
 * RegistroBruto associado CLASSIFICADO" (DOMAIN_MODEL.md) exige isso
 * — fora de produção, sem `OPENAI_API_KEY`, isso roda via
 * `FakeLocalPortaDeIA` automaticamente, sem precisar de chave real
 * nem pular o teste (ver src/inbox/infrastructure/composicao.ts).
 *
 * Nota (Sprint 13 — Boot): a lista da Agenda nunca renderiza o campo
 * `local` da Reunião — o `<li>` só mostra data/hora, tipo e status
 * (confirmado contra a aplicação real). O identificador único e
 * estável disponível na tela é a data/hora formatada, então os testes
 * filtram por ela em vez de `local` (`local` continua sendo usado só
 * para compor um texto único no segundo teste). O campo `datetime-local`
 * só tem granularidade de minuto — por isso cada teste soma um jitter
 * aleatório ao offset base, evitando que os dois testes (ou duas
 * execuções próximas no tempo) gerem o mesmo horário exibido e colidam
 * no filtro.
 */
// A página de Agenda só lista itens dentro da semana atual (segunda a
// domingo — ver inicioDaSemanaAtual() em src/app/(shell)/agenda/page.tsx).
// O jitter não pode ultrapassar esse limite ou o item criado nunca
// aparece na tela.
function minutosAteFimDaSemana(): number {
  const agora = new Date();
  const diaSemana = agora.getDay(); // 0 = domingo
  const diasAteDomingo = diaSemana === 0 ? 0 : 7 - diaSemana;
  const fimDaSemana = new Date(agora);
  fimDaSemana.setDate(agora.getDate() + diasAteDomingo);
  fimDaSemana.setHours(23, 59, 0, 0);
  return Math.floor((fimDaSemana.getTime() - agora.getTime()) / 60_000);
}

function minutosComJitter(base: number): number {
  // Sprint 15 — Green Deploy: janela dinâmica (era uma constante de 180
  // min) — com muitas execuções acumuladas no mesmo dia (mesmo ambiente
  // de homologação, sem reset entre rodadas), uma janela fixa pequena
  // colidia por acaso com horários de rodadas anteriores. Usa o máximo
  // de entropia disponível até o fim da semana (com folga de segurança),
  // sem nunca ultrapassar o limite real da visão semanal da Agenda.
  const margemSegura = Math.max(minutosAteFimDaSemana() - base - 30, 60);
  return base + Math.floor(Math.random() * margemSegura);
}
test.describe("Agenda", () => {
  test("criar reunião → aparece na agenda → marcar como realizada", async ({ page }) => {
    const dataHora = dataHoraLocalDaquiA(minutosComJitter(60));
    const dataHoraVisivel = new Date(dataHora).toLocaleString("pt-BR");

    await page.goto("/agenda");

    const agendar = page.getByRole("region", { name: "Agendar reunião" });
    await agendar.getByLabel("Data e hora").fill(dataHora);
    await agendar.getByLabel("Local").fill(`Sala E2E ${sufixoUnico()}`);
    await agendar.getByRole("button", { name: "Agendar" }).click();

    const item = page.getByRole("listitem").filter({ hasText: dataHoraVisivel });
    await expect(item).toBeVisible();
    await expect(item.getByText("Reunião — status: agendada")).toBeVisible();

    await item.getByRole("button", { name: "Marcar como realizada" }).click();

    await expect(item.getByText("Reunião — status: realizada")).toBeVisible();
    await expect(item.getByRole("link", { name: "Inbox" })).toBeVisible();
  });

  test("reunião realizada → registro bruto associado e classificado → marcar como processada", async ({
    page,
  }) => {
    const dataHora = dataHoraLocalDaquiA(minutosComJitter(60));
    const dataHoraVisivel = new Date(dataHora).toLocaleString("pt-BR");
    const local = `Sala E2E ${sufixoUnico()}`;
    const notaDaReuniao = `Nota da reunião ${local} — decidimos priorizar o case do salão de beleza.`;

    await page.goto("/agenda");
    const agendar = page.getByRole("region", { name: "Agendar reunião" });
    await agendar.getByLabel("Data e hora").fill(dataHora);
    await agendar.getByLabel("Local").fill(local);
    await agendar.getByRole("button", { name: "Agendar" }).click();

    const item = page.getByRole("listitem").filter({ hasText: dataHoraVisivel });
    await item.getByRole("button", { name: "Marcar como realizada" }).click();
    await expect(item.getByText("Reunião — status: realizada")).toBeVisible();

    await item.getByRole("link", { name: "Inbox" }).click();
    await expect(page).toHaveURL(/\/inbox\?reuniaoId=/);

    const capturarTexto = page.getByRole("region", { name: "Capturar (texto)" });
    await capturarTexto.getByLabel("Conteúdo").fill(notaDaReuniao);
    await capturarTexto.getByRole("button", { name: "Capturar" }).click();

    const registro = page.getByRole("listitem").filter({ hasText: notaDaReuniao });
    await expect(registro.getByText("IA sugere:")).toBeVisible();
    await registro.getByRole("button", { name: "Aceitar" }).click();
    // Aceitar não remove o registro da Inbox (a página lista todos os
    // status por padrão) — só a UI de sugestão pendente desaparece.
    await expect(registro.getByText("IA sugere:")).toHaveCount(0);

    await page.goto("/agenda");
    const itemFinal = page.getByRole("listitem").filter({ hasText: dataHoraVisivel });
    await itemFinal.getByRole("button", { name: "Marcar como processada" }).click();

    await expect(itemFinal.getByText("Reunião — status: processada")).toBeVisible();
  });
});
