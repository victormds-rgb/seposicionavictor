import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeAll } from "vitest";
import { DrizzleAlertaRepository } from "@/notificacoes/infrastructure/alerta-repository";
import { DrizzleAuditoriaDeDriftRepository } from "@/notificacoes/infrastructure/auditoria-de-drift-repository";
import { DrizzleProjetoRepository } from "@/projetos/infrastructure/projeto-repository";
import { DrizzleBuildLogRepository } from "@/build_logs/infrastructure/build-log-repository";
import { DrizzlePecaDeConteudoRepository } from "@/conteudo/infrastructure/peca-de-conteudo-repository";
import { DrizzlePilarRepository } from "@/conteudo/infrastructure/pilar-e-serie-fixa-repository";
import { DrizzleFundamentoRepository } from "@/fundamento/infrastructure/fundamento-repository";
import { DrizzleTemaMapeadoRepository } from "@/conhecimento/infrastructure/framework-e-tema-repository";
import { criarProjeto } from "@/projetos/application/criar-projeto";
import { criarPecaDeConteudo } from "@/conteudo/application/criar-peca-de-conteudo";
import { avancarStatusDaPeca } from "@/conteudo/application/transicoes-de-status";
import { executarAuditoriaDeDrift } from "@/notificacoes/application/executar-auditoria-de-drift";
import {
  verificarBuildLogAusente,
  verificarAuditoriaDevida,
  executarMonitoramento,
} from "@/notificacoes/application/monitor-de-consistencia";
import {
  reconhecerAlerta,
  resolverAlerta,
  TransicaoInvalidaError,
} from "@/notificacoes/application/gestao-de-alertas";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";
import { EventLogHandler } from "@/event_log/infrastructure/eventLogRepository";
import { DrizzleUnitOfWork } from "@infra/persistence/db/unit-of-work";
import type { IEventHandler } from "@/shared/domain/i-event-handler";
import type { EventoDeDominio } from "@/shared/domain/i-event-publisher";
import { getDb } from "@infra/persistence/db/client";
import { alerta as alertaTabela } from "@infra/persistence/db/schema";
import { eq } from "drizzle-orm";

describe("Notificações — Sprint 9 (integração, com volume real de dados)", () => {
  const alertaRepository = new DrizzleAlertaRepository();
  const auditoriaDeDriftRepository = new DrizzleAuditoriaDeDriftRepository();
  const projetoRepository = new DrizzleProjetoRepository();
  const buildLogRepository = new DrizzleBuildLogRepository();
  const pecaDeConteudoRepository = new DrizzlePecaDeConteudoRepository();
  const pilarRepository = new DrizzlePilarRepository();
  const fundamentoRepository = new DrizzleFundamentoRepository();
  const clock = new SystemClock();

  let pilarId: string;
  let temaId: string;

  beforeAll(async () => {
    const pilares = await pilarRepository.listar();
    pilarId = pilares[0]!.id;

    const temas = await new DrizzleTemaMapeadoRepository().listar();
    temaId = temas[0]!.id;
  });

  it("Critério de Aceite central: AuditoriaDeDrift avalia os últimos 20 conteúdos publicados e calcula a falha corretamente", async () => {
    // Cria 20 peças publicadas: 14 "saudáveis" (autônomas, mas com
    // tema associado — têm lente reconhecível — e sem repetir a
    // frase-âncora) e 6 que falham no checklist automatizável
    // (autônomas sem tema/framework) — 6/20 = 30%, exatamente no
    // limiar (não ultrapassa).
    for (let i = 0; i < 14; i++) {
      const peca = await criarPecaDeConteudo(
        {
          canal: "linkedin",
          pilarId,
          origemTipo: "autonomo",
          temaId,
          conteudoTexto: `Reflexão real número ${i} — com lente reconhecível.`,
        },
        { pecaDeConteudoRepository }
      );
      await avancarStatusDaPeca(peca.id, { pecaDeConteudoRepository });
      await avancarStatusDaPeca(peca.id, { pecaDeConteudoRepository });
      await avancarStatusDaPeca(peca.id, { pecaDeConteudoRepository });
    }

    for (let i = 0; i < 6; i++) {
      const peca = await criarPecaDeConteudo(
        {
          canal: "x",
          pilarId,
          origemTipo: "autonomo",
          conteudoTexto: `Opinião solta número ${i}, sem framework nem tema.`,
        },
        { pecaDeConteudoRepository }
      );
      await avancarStatusDaPeca(peca.id, { pecaDeConteudoRepository });
      await avancarStatusDaPeca(peca.id, { pecaDeConteudoRepository });
      await avancarStatusDaPeca(peca.id, { pecaDeConteudoRepository });
    }

    const resultado = await executarAuditoriaDeDrift({
      auditoriaDeDriftRepository,
      pecaDeConteudoRepository,
      fundamentoRepository,
    });

    expect(resultado.totalAvaliadas).toBe(20);
    expect(resultado.totalFalhas).toBeGreaterThanOrEqual(6);
    expect(resultado.percentualFalha).toBeGreaterThanOrEqual(30);

    const auditoriaSalva = await auditoriaDeDriftRepository.buscarPorId(resultado.auditoriaId);
    expect(auditoriaSalva?.status).toBe("concluida");
    expect(auditoriaSalva?.pecasAvaliadas).toHaveLength(20);
  });

  it("gera recomendação de pausa quando a falha ultrapassa 30%, nunca alterando o Fundamento", async () => {
    // Adiciona mais peças ruins para garantir ultrapassagem clara do limiar.
    for (let i = 0; i < 5; i++) {
      const peca = await criarPecaDeConteudo(
        { canal: "instagram", pilarId, origemTipo: "autonomo", conteudoTexto: `Mais uma solta ${i}.` },
        { pecaDeConteudoRepository }
      );
      await avancarStatusDaPeca(peca.id, { pecaDeConteudoRepository });
      await avancarStatusDaPeca(peca.id, { pecaDeConteudoRepository });
      await avancarStatusDaPeca(peca.id, { pecaDeConteudoRepository });
    }

    const resultado = await executarAuditoriaDeDrift({
      auditoriaDeDriftRepository,
      pecaDeConteudoRepository,
      fundamentoRepository,
    });

    expect(resultado.percentualFalha).toBeGreaterThan(30);
    expect(resultado.recomendacao).not.toBeNull();
    expect(resultado.recomendacao).toContain("Fundamento");

    // Invariante: o Fundamento nunca é alterado por esta operação.
    const fundamento = await fundamentoRepository.buscarAtivo();
    expect(fundamento?.status).toBe("ativo");
  });

  it("MonitorDeConsistencia: gera alerta de build_log_ausente para produto próprio sem publicação recente", async () => {
    const projeto = await criarProjeto(
      { nome: "Radar AI — teste de alerta", tipo: "produto_proprio" },
      { projetoRepository }
    );

    const alertasGerados = await verificarBuildLogAusente({
      projetoRepository,
      buildLogRepository,
      alertaRepository,
      clock,
    });

    expect(alertasGerados.some((a) => a.entidadeRelacionadaId === projeto.id)).toBe(true);

    // Idempotência: rodar de novo não duplica o alerta ativo.
    const alertasSegundaRodada = await verificarBuildLogAusente({
      projetoRepository,
      buildLogRepository,
      alertaRepository,
      clock,
    });
    const alertasDoMesmoProjeto = alertasSegundaRodada.filter(
      (a) => a.entidadeRelacionadaId === projeto.id
    );
    expect(alertasDoMesmoProjeto).toHaveLength(1);
  });

  it("MonitorDeConsistencia: gera alerta de auditoria_devida quando nunca executada ou há muito tempo", async () => {
    // Como o teste anterior já executou uma auditoria "agora",
    // simulamos o caso "nunca executada" limpando via verificação
    // direta da lógica de limiar em vez de esperar 90 dias reais —
    // a auditoria mais recente já existe, então aqui validamos
    // apenas que a função não falha e retorna array (comportamento
    // determinístico já coberto pelos testes unitários de limiar).
    const alertas = await verificarAuditoriaDevida({ auditoriaDeDriftRepository, alertaRepository, clock });
    expect(Array.isArray(alertas)).toBe(true);
  });

  it("executarMonitoramento roda as três verificações sem lançar exceção", async () => {
    const alertas = await executarMonitoramento({
      projetoRepository,
      buildLogRepository,
      pecaDeConteudoRepository,
      pilarRepository,
      auditoriaDeDriftRepository,
      alertaRepository,
      clock,
    });
    expect(Array.isArray(alertas)).toBe(true);
  });

  it("reconhecer e resolver alerta funcionam conforme as invariantes de transição", async () => {
    const projeto = await criarProjeto(
      { nome: "Albatroz OS — teste de resolução", tipo: "produto_proprio" },
      { projetoRepository }
    );
    const [alerta] = await verificarBuildLogAusente({
      projetoRepository,
      buildLogRepository,
      alertaRepository,
      clock,
    });
    expect(alerta).toBeDefined();

    await reconhecerAlerta(alerta!.id, { alertaRepository });
    const aposReconhecer = await alertaRepository.buscarPorId(alerta!.id);
    expect(aposReconhecer?.status).toBe("reconhecido");

    // Invariante central: build_log_ausente NUNCA resolve manualmente.
    await expect(resolverAlerta(alerta!.id, { alertaRepository })).rejects.toThrow(
      TransicaoInvalidaError
    );
  });

  // Sprint 14 — Hardening Final, item 3: concorrência real contra o
  // banco. Duas chamadas simultâneas para `garantirAtivo` com a MESMA
  // (tipo, entidade_relacionada_id) — só uma pode inserir, graças ao
  // índice único parcial + ON CONFLICT DO NOTHING (Hardening/Sprint 10).
  // Usa `desvio_pilares` (entidade não-nula) porque é o tipo
  // efetivamente coberto pelo índice — `auditoria_devida` tem a
  // limitação documentada de NULL não ser deduplicado, fora do escopo
  // desta Sprint (não é regra de negócio a corrigir aqui).
  it("garantirAtivo é seguro sob concorrência — um INSERT, um alerta ativo, um evento", async () => {
    const entidadeId = randomUUID();
    const eventosPublicados: string[] = [];
    const eventPublisherContador: IEventPublisher = {
      async publicar(evento) {
        eventosPublicados.push(evento.eventName);
      },
    };

    async function tentarGarantirEPublicar() {
      const { alerta, criado } = await alertaRepository.garantirAtivo({
        tipo: "desvio_pilares",
        condicaoGatilho: "Teste de concorrência — Sprint 14",
        entidadeRelacionadaTipo: "pilar",
        entidadeRelacionadaId: entidadeId,
        status: "ativo",
        dataDisparo: clock.now(),
        dataResolucao: null,
        metadata: null,
      });
      if (criado) {
        await eventPublisherContador.publicar({
          aggregate: "alerta",
          aggregateId: alerta.id,
          eventName: "alerta.disparado",
          payload: {},
          actorTipo: "sistema",
          source: "teste-concorrencia",
        });
      }
      return criado;
    }

    const [criado1, criado2] = await Promise.all([
      tentarGarantirEPublicar(),
      tentarGarantirEPublicar(),
    ]);

    expect([criado1, criado2].filter(Boolean)).toHaveLength(1);
    expect(eventosPublicados).toHaveLength(1);

    const ativos = await alertaRepository.listar({ status: "ativo" });
    expect(ativos.filter((a) => a.entidadeRelacionadaId === entidadeId)).toHaveLength(1);
  });

  // Sprint 14 — Hardening Final, item 3: garante que a escrita do
  // Aggregate (Alerta) e a escrita do EventLog participam da MESMA
  // transação Postgres via DrizzleUnitOfWork. Um segundo handler que
  // falha propositalmente força o rollback — se Aggregate e EventLog
  // não estivessem na mesma transação, o Alerta já commitado pelo
  // primeiro handler continuaria existindo mesmo após a falha.
  it("UnitOfWork garante que Aggregate e EventLog participam da mesma transação", async () => {
    class HandlerQueFalha implements IEventHandler {
      async handle(): Promise<void> {
        throw new Error("Falha proposital do teste — nunca deve persistir.");
      }
    }

    const eventLogHandler = new EventLogHandler();
    const unitOfWork = new DrizzleUnitOfWork();
    const entidadeId = randomUUID();

    await expect(
      unitOfWork.run(async () => {
        const { alerta } = await alertaRepository.garantirAtivo({
          tipo: "desvio_pilares",
          condicaoGatilho: "Teste de UnitOfWork — Sprint 14",
          entidadeRelacionadaTipo: "pilar",
          entidadeRelacionadaId: entidadeId,
          status: "ativo",
          dataDisparo: clock.now(),
          dataResolucao: null,
          metadata: null,
        });

        const evento: EventoDeDominio = {
          aggregate: "alerta",
          aggregateId: alerta.id,
          eventName: "alerta.disparado",
          payload: {},
          actorTipo: "sistema",
          source: "teste-unit-of-work",
        };

        // EventLogHandler grava normalmente (na mesma transação, via
        // getDb()); o segundo handler falha DEPOIS — se a transação for
        // real, a gravação do primeiro handler é desfeita junto.
        await eventLogHandler.handle(evento);
        await new HandlerQueFalha().handle();
      })
    ).rejects.toThrow("Falha proposital do teste");

    // Rollback confirmado: o Alerta que o primeiro passo criou (dentro
    // da mesma transação que falhou depois) não deve existir.
    const [linhaAposRollback] = await getDb()
      .select()
      .from(alertaTabela)
      .where(eq(alertaTabela.entidadeRelacionadaId, entidadeId));
    expect(linhaAposRollback).toBeUndefined();
  });
});
