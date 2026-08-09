import { DrizzleAlertaRepository } from "@/notificacoes/infrastructure/alerta-repository";
import { DrizzleAuditoriaDeDriftRepository } from "@/notificacoes/infrastructure/auditoria-de-drift-repository";
import { DrizzleProjetoRepository } from "@/projetos/infrastructure/projeto-repository";
import { DrizzleBuildLogRepository } from "@/build_logs/infrastructure/build-log-repository";
import { DrizzlePecaDeConteudoRepository } from "@/conteudo/infrastructure/peca-de-conteudo-repository";
import { DrizzlePilarRepository } from "@/conteudo/infrastructure/pilar-e-serie-fixa-repository";
import { DrizzleFundamentoRepository } from "@/fundamento/infrastructure/fundamento-repository";
import { DrizzleLeadRepository } from "@/pipeline_comercial/infrastructure/lead-repository";
import { criarEventDispatcher } from "@/event_log/infrastructure/composicao";
import { DrizzleUnitOfWork } from "@infra/persistence/db/unit-of-work";

export function criarDependenciasDeNotificacoes() {
  return {
    alertaRepository: new DrizzleAlertaRepository(),
    auditoriaDeDriftRepository: new DrizzleAuditoriaDeDriftRepository(),
    projetoRepository: new DrizzleProjetoRepository(),
    buildLogRepository: new DrizzleBuildLogRepository(),
    pecaDeConteudoRepository: new DrizzlePecaDeConteudoRepository(),
    pilarRepository: new DrizzlePilarRepository(),
    fundamentoRepository: new DrizzleFundamentoRepository(),
    // Sprint 42 — usado por `verificarLeadsParados`.
    leadRepository: new DrizzleLeadRepository(),
    eventPublisher: criarEventDispatcher(),
    unitOfWork: new DrizzleUnitOfWork(),
  };
}
