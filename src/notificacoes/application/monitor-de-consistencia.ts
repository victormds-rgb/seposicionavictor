import type { AlertaRepository } from "@/notificacoes/domain/notificacoes-repository";
import type { TipoAlerta } from "@/notificacoes/domain/alerta";
import type { AuditoriaDeDriftRepository } from "@/notificacoes/domain/notificacoes-repository";
import type { ProjetoRepository } from "@/projetos/domain/projeto-repository";
import type { BuildLogRepository } from "@/build_logs/domain/build-log-repository";
import type { PecaDeConteudoRepository, PilarRepository } from "@/conteudo/domain/peca-de-conteudo-repository";
import { calcularDistribuicaoDePilares } from "@/conteudo/application/calcular-distribuicao-de-pilares";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";
import type { Clock } from "@/shared/domain/clock";
import type { UnitOfWork } from "@/shared/domain/unit-of-work";

/**
 * `MonitorDeConsistencia` (ARCHITECTURE.md, seção 7) — as três
 * verificações de Alerta previstas para a Sprint 9 (SOM Cap. 8.1):
 * build_log_ausente, desvio_pilares, auditoria_devida.
 *
 * DECISÃO DE ENGENHARIA: limiares concretos escolhidos onde o SOM dá
 * apenas uma faixa:
 * - "mais de 2-3 semanas sem build log" → 21 dias (limite superior da
 *   faixa, decisão explícita, não a mais permissiva).
 * - Desvio de pilares → mesmo limiar de 30% já usado na Auditoria de
 *   Drift (DATABASE.md, Decisão de Engenharia já registrada).
 * - Auditoria trimestral devida → 90 dias desde a última execução
 *   (ou nunca executada).
 *
 * Nota de execução: extraído para Job do Scheduler
 * (`infra/scheduler/jobs/monitor-de-consistencia-job.ts`) na etapa de
 * Hardening — não roda mais durante o carregamento do Dashboard.
 */

const DIAS_LIMITE_BUILD_LOG_AUSENTE = 21;
const LIMIAR_DESVIO_PILARES = 30;
const DIAS_LIMITE_AUDITORIA_DEVIDA = 90;

/**
 * Exportada (Sprint 23 — DOGFOODING_REPORT.md, item 2): reaproveitada
 * por `executarAuditoriaDeDrift` para transformar uma falha crítica de
 * auditoria num Alerta real, em vez de deixar o resultado só no
 * histórico da própria auditoria. Mesma função, mesma semântica
 * idempotente de sempre — só passou a ser visível fora deste módulo.
 */
export async function garantirAlertaAtivo(
  tipo: TipoAlerta,
  condicaoGatilho: string,
  entidadeRelacionadaTipo: string | null,
  entidadeRelacionadaId: string | null,
  deps: {
    alertaRepository: AlertaRepository;
    eventPublisher?: IEventPublisher;
    clock: Clock;
    unitOfWork?: UnitOfWork;
  }
) {
  const persistirEPublicar = async () => {
    // Atômico em si (índice único parcial + ON CONFLICT DO NOTHING):
    // se outra execução concorrente já criou o alerta ativo, `criado`
    // vem `false` e o evento não é publicado de novo.
    const { alerta, criado } = await deps.alertaRepository.garantirAtivo({
      tipo,
      condicaoGatilho,
      entidadeRelacionadaTipo,
      entidadeRelacionadaId,
      status: "ativo",
      dataDisparo: deps.clock.now(),
      dataResolucao: null,
      metadata: null,
    });

    if (!criado) return alerta;

    await deps.eventPublisher?.publicar({
      aggregate: "alerta",
      aggregateId: alerta.id,
      eventName: "alerta.disparado",
      payload: { tipo, condicaoGatilho },
      actorTipo: "sistema",
      source: "notificacoes.monitor_de_consistencia",
    });

    return alerta;
  };

  // Com UnitOfWork disponível, a criação do Alerta e a gravação do
  // evento no event_log rodam na mesma transação Postgres — se a
  // publicação do evento falhar, a criação do Alerta é revertida
  // (nunca fica um Alerta sem o evento correspondente). Sem
  // UnitOfWork, o comportamento é idêntico ao anterior a esta etapa
  // de Hardening.
  return deps.unitOfWork ? deps.unitOfWork.run(persistirEPublicar) : persistirEPublicar();
}

export async function verificarBuildLogAusente(deps: {
  projetoRepository: ProjetoRepository;
  buildLogRepository: BuildLogRepository;
  alertaRepository: AlertaRepository;
  eventPublisher?: IEventPublisher;
  clock: Clock;
  unitOfWork?: UnitOfWork;
}) {
  const projetosProdutoProprio = await deps.projetoRepository.listar({ tipo: "produto_proprio" });
  const limite = new Date(deps.clock.now());
  limite.setDate(limite.getDate() - DIAS_LIMITE_BUILD_LOG_AUSENTE);

  const alertasGerados = [];
  for (const projeto of projetosProdutoProprio) {
    if (projeto.status === "encerrado") continue;

    const ultimoPublicado = await deps.buildLogRepository.buscarUltimoPublicado(projeto.id);
    const ausenteHaMuitoTempo =
      !ultimoPublicado?.dataPublicacao || ultimoPublicado.dataPublicacao < limite;

    if (ausenteHaMuitoTempo) {
      const alerta = await garantirAlertaAtivo(
        "build_log_ausente",
        `Nenhum Build Log publicado nos últimos ${DIAS_LIMITE_BUILD_LOG_AUSENTE} dias para o projeto "${projeto.nome}".`,
        "projeto",
        projeto.id,
        {
          alertaRepository: deps.alertaRepository,
          eventPublisher: deps.eventPublisher,
          clock: deps.clock,
          unitOfWork: deps.unitOfWork,
        }
      );
      alertasGerados.push(alerta);
    }
  }
  return alertasGerados;
}

export async function verificarDesvioDePilares(deps: {
  pecaDeConteudoRepository: PecaDeConteudoRepository;
  pilarRepository: PilarRepository;
  alertaRepository: AlertaRepository;
  eventPublisher?: IEventPublisher;
  clock: Clock;
  unitOfWork?: UnitOfWork;
}) {
  const distribuicao = await calcularDistribuicaoDePilares(undefined, deps);

  const alertasGerados = [];
  for (const pilar of distribuicao) {
    if (Math.abs(pilar.desvio) > LIMIAR_DESVIO_PILARES) {
      const alerta = await garantirAlertaAtivo(
        "desvio_pilares",
        `Pilar "${pilar.nome}" com desvio de ${pilar.desvio}% em relação à meta (${pilar.pesoAlvoPercentual}%).`,
        "pilar",
        pilar.pilarId,
        {
          alertaRepository: deps.alertaRepository,
          eventPublisher: deps.eventPublisher,
          clock: deps.clock,
          unitOfWork: deps.unitOfWork,
        }
      );
      alertasGerados.push(alerta);
    }
  }
  return alertasGerados;
}

export async function verificarAuditoriaDevida(deps: {
  auditoriaDeDriftRepository: AuditoriaDeDriftRepository;
  alertaRepository: AlertaRepository;
  eventPublisher?: IEventPublisher;
  clock: Clock;
  unitOfWork?: UnitOfWork;
}) {
  const maisRecente = await deps.auditoriaDeDriftRepository.buscarMaisRecente();
  const limite = new Date(deps.clock.now());
  limite.setDate(limite.getDate() - DIAS_LIMITE_AUDITORIA_DEVIDA);

  const devida = !maisRecente || maisRecente.dataExecucao < limite;
  if (!devida) return [];

  const alerta = await garantirAlertaAtivo(
    "auditoria_devida",
    `Nenhuma Auditoria de Drift executada nos últimos ${DIAS_LIMITE_AUDITORIA_DEVIDA} dias.`,
    null,
    null,
    {
      alertaRepository: deps.alertaRepository,
      eventPublisher: deps.eventPublisher,
      clock: deps.clock,
      unitOfWork: deps.unitOfWork,
    }
  );
  return [alerta];
}

export async function executarMonitoramento(deps: {
  projetoRepository: ProjetoRepository;
  buildLogRepository: BuildLogRepository;
  pecaDeConteudoRepository: PecaDeConteudoRepository;
  pilarRepository: PilarRepository;
  auditoriaDeDriftRepository: AuditoriaDeDriftRepository;
  alertaRepository: AlertaRepository;
  eventPublisher?: IEventPublisher;
  clock: Clock;
  unitOfWork?: UnitOfWork;
}) {
  const buildLogAlertas = await verificarBuildLogAusente(deps);
  const pilaresAlertas = await verificarDesvioDePilares(deps);
  const auditoriaAlertas = await verificarAuditoriaDevida(deps);

  return [...buildLogAlertas, ...pilaresAlertas, ...auditoriaAlertas];
}
