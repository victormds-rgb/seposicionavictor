import { describe, it, expect } from "vitest";
import { DrizzleLeadRepository } from "@/pipeline_comercial/infrastructure/lead-repository";
import { DrizzleAlertaRepository } from "@/notificacoes/infrastructure/alerta-repository";
import { criarLead } from "@/pipeline_comercial/application/criar-lead";
import { verificarLeadsParados } from "@/notificacoes/application/monitor-comercial";
import { LIMITE_HORAS_LEAD_PARADO } from "@/pipeline_comercial/domain/inteligencia-comercial";
import type { Clock } from "@/shared/domain/clock";

/**
 * Sprint 42 (Fundação Comercial) — mesmo padrão de idempotência já
 * coberto para `drift_critico`/`build_log_ausente`
 * (tests/integration/notificacoes/fluxo-completo.test.ts): rodar o
 * Job duas vezes não duplica o Alerta.
 *
 * O Lead criado neste teste é real (banco real), mas "48h no passado"
 * não pode ser esperado de verdade — por isso o `Clock` injetado em
 * `verificarLeadsParados` é adiantado manualmente, sem afetar
 * `createdAt` (que continua sendo o instante real da inserção). Isso
 * não inventa dado nenhum: só simula "que horas são agora" para a
 * verificação, exatamente como o parâmetro `Clock` foi desenhado para
 * permitir (ver `src/shared/domain/clock.ts`).
 */
function clockAdiantado(horas: number): Clock {
  return { now: () => new Date(Date.now() + horas * 60 * 60 * 1000) };
}

describe("Monitor Comercial — lead_parado (integração)", () => {
  const leadRepository = new DrizzleLeadRepository();
  const alertaRepository = new DrizzleAlertaRepository();

  it("primeira execução cria o alerta; segunda execução não duplica (idempotente)", async () => {
    const lead = await criarLead({ nome: "Lead que vai ficar parado" }, { leadRepository });
    const clockFuturo = clockAdiantado(LIMITE_HORAS_LEAD_PARADO + 1);

    await verificarLeadsParados({ leadRepository, alertaRepository, clock: clockFuturo });
    const primeiroAlerta = await alertaRepository.buscarAtivoPorTipoEEntidade("lead_parado", lead.id);
    expect(primeiroAlerta).not.toBeNull();
    expect(primeiroAlerta?.condicaoGatilho).toContain(lead.nome);

    await verificarLeadsParados({ leadRepository, alertaRepository, clock: clockFuturo });
    const alertasAtivos = await alertaRepository.listar({ status: "ativo", tipo: "lead_parado" });
    const paraEsteLead = alertasAtivos.filter((a) => a.entidadeRelacionadaId === lead.id);
    expect(paraEsteLead).toHaveLength(1);
  });

  it("um lead recém-criado (dentro do limite) não gera alerta", async () => {
    const lead = await criarLead({ nome: "Lead recém-criado, ainda dentro do prazo" }, { leadRepository });

    await verificarLeadsParados({ leadRepository, alertaRepository, clock: { now: () => new Date() } });

    const alerta = await alertaRepository.buscarAtivoPorTipoEEntidade("lead_parado", lead.id);
    expect(alerta).toBeNull();
  });

  it("um lead agendado não gera alerta mesmo muito tempo depois (status excluído)", async () => {
    const lead = await criarLead({ nome: "Lead agendado há muito tempo" }, { leadRepository });
    await leadRepository.atualizarStatusComercial(lead.id, "agendado");

    const clockFuturo = clockAdiantado(LIMITE_HORAS_LEAD_PARADO * 10);
    await verificarLeadsParados({ leadRepository, alertaRepository, clock: clockFuturo });

    const alerta = await alertaRepository.buscarAtivoPorTipoEEntidade("lead_parado", lead.id);
    expect(alerta).toBeNull();
  });
});
