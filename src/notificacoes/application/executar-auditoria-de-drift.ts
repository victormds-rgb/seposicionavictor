import type { AuditoriaDeDriftRepository, AlertaRepository } from "@/notificacoes/domain/notificacoes-repository";
import type { PecaDeConteudoRepository } from "@/conteudo/domain/peca-de-conteudo-repository";
import type { FundamentoRepository } from "@/fundamento/domain/fundamento";
import {
  falhouChecklistAutomatizavel,
  repetiuFraseAncora,
  semLenteReconhecivel,
  calcularPercentualFalha,
  ultrapassouLimiar,
  gerarRecomendacao,
} from "@/notificacoes/domain/auditoria-de-drift";
import { garantirAlertaAtivo } from "@/notificacoes/application/monitor-de-consistencia";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";
import type { Clock } from "@/shared/domain/clock";
import type { UnitOfWork } from "@/shared/domain/unit-of-work";

export class FundamentoNaoEncontradoError extends Error {}

const QUANTIDADE_PECAS_AUDITADAS = 20;

/**
 * Use Case: `AuditoriaDeDrift` (SOM Cap. 8.2) — avalia os últimos 20
 * conteúdos publicados contra o checklist automatizável (ver nota de
 * conformidade em `notificacoes/domain/auditoria-de-drift.ts`).
 *
 * Se a falha ultrapassar 30%, gera recomendação de pausa e revisão do
 * Fundamento — NUNCA uma ação automática sobre ele (invariante do
 * DOMAIN_MODEL.md, preservada aqui: nenhuma escrita em `fundamento`).
 * Emite os eventos catalogados `auditoria.concluida` e, quando
 * aplicável, `auditoria.falha_critica_detectada`.
 */
export async function executarAuditoriaDeDrift(deps: {
  auditoriaDeDriftRepository: AuditoriaDeDriftRepository;
  pecaDeConteudoRepository: PecaDeConteudoRepository;
  fundamentoRepository: FundamentoRepository;
  alertaRepository: AlertaRepository;
  eventPublisher?: IEventPublisher;
  clock: Clock;
  unitOfWork?: UnitOfWork;
}) {
  const fundamento = await deps.fundamentoRepository.buscarAtivo();
  if (!fundamento) {
    throw new FundamentoNaoEncontradoError("Nenhum Fundamento ativo encontrado.");
  }

  const auditoria = await deps.auditoriaDeDriftRepository.criar({
    dataExecucao: new Date(),
    pecasAvaliadas: [],
    percentualFalha: null,
    recomendacaoGerada: null,
    status: "em_execucao",
  });

  const pecas = await deps.pecaDeConteudoRepository.listarUltimasPublicadas(
    QUANTIDADE_PECAS_AUDITADAS
  );

  const falhas = pecas.filter((peca) =>
    falhouChecklistAutomatizavel(
      {
        id: peca.id,
        conteudoTexto: peca.conteudoTexto,
        origemTipo: peca.origemTipo,
        temaId: peca.temaId,
        frameworkId: peca.frameworkId,
      },
      fundamento.fraseAncora
    )
  );

  const percentualFalha = calcularPercentualFalha(falhas.length, pecas.length);
  const recomendacaoBase = gerarRecomendacao(percentualFalha);

  // Sprint 23B, item 3: diagnóstico honesto — diz qual critério
  // reprovou cada peça, em vez de deixar o usuário supor uma causa
  // (ex.: Brand Intelligence não sincronizado) que o checklist nem
  // avalia. Não altera se uma recomendação é gerada, nem o limiar —
  // só acrescenta o "porquê" quando há recomendação.
  const comFraseRepetida = falhas.filter((p) => repetiuFraseAncora(p, fundamento.fraseAncora)).length;
  const semLente = falhas.filter((p) => semLenteReconhecivel(p)).length;
  const diagnostico =
    recomendacaoBase && falhas.length > 0
      ? ` Diagnóstico: ${semLente} peça(s) sem tema/framework associado, ${comFraseRepetida} repetindo a frase-âncora do Fundamento — nenhuma falha relacionada a Brand Intelligence/sincronização.`
      : "";
  const recomendacao = recomendacaoBase ? recomendacaoBase + diagnostico : recomendacaoBase;

  await deps.auditoriaDeDriftRepository.atualizar(auditoria.id, {
    pecasAvaliadas: pecas.map((p) => p.id),
    percentualFalha,
    recomendacaoGerada: recomendacao,
    status: "concluida",
  });

  await deps.eventPublisher?.publicar({
    aggregate: "auditoria_drift",
    aggregateId: auditoria.id,
    eventName: "auditoria.concluida",
    payload: { totalAvaliadas: pecas.length, totalFalhas: falhas.length, percentualFalha },
    actorTipo: "sistema",
    source: "notificacoes.executar_auditoria",
  });

  if (ultrapassouLimiar(percentualFalha)) {
    await deps.eventPublisher?.publicar({
      aggregate: "auditoria_drift",
      aggregateId: auditoria.id,
      eventName: "auditoria.falha_critica_detectada",
      payload: { percentualFalha, recomendacao },
      actorTipo: "sistema",
      source: "notificacoes.executar_auditoria",
    });

    // Sprint 23 — DOGFOODING_REPORT.md, item 2: sem isto, uma falha
    // crítica detectada aqui só ficava visível no histórico desta
    // própria página de Auditoria — o Dashboard (que já lista Alertas
    // ativos) nunca refletia o problema. `garantirAlertaAtivo` é o
    // mesmo mecanismo idempotente já usado pelo MonitorDeConsistencia.
    //
    // Sprint 29 (dogfooding): a chave de deduplicação usada aqui
    // precisa ser ESTÁVEL entre execuções — `auditoria.id` é gerado de
    // novo a cada chamada desta função, então o índice único parcial
    // (tipo, entidade_relacionada_id) nunca colidia e cada execução da
    // auditoria criava um novo Alerta "ativo" mesmo com a condição
    // inalterada (2 alertas duplicados observados em produção,
    // exigindo Reconhecer/Resolver manual em cada um). `fundamento.id`
    // é estável enquanto o mesmo Fundamento seguir ativo — mesma
    // condição, mesmo Alerta, até ser resolvido.
    await garantirAlertaAtivo(
      "drift_critico",
      recomendacao ?? `Auditoria de Drift com ${percentualFalha}% de falha no checklist automatizável.`,
      "fundamento",
      fundamento.id,
      {
        alertaRepository: deps.alertaRepository,
        eventPublisher: deps.eventPublisher,
        clock: deps.clock,
        unitOfWork: deps.unitOfWork,
      }
    );
  }

  return {
    auditoriaId: auditoria.id,
    totalAvaliadas: pecas.length,
    totalFalhas: falhas.length,
    percentualFalha,
    recomendacao,
  };
}
