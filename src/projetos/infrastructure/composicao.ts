import { DrizzleProjetoRepository } from "@/projetos/infrastructure/projeto-repository";
import { DrizzleCaseRepository } from "@/cases/infrastructure/case-repository";
import { DrizzleBuildLogRepository } from "@/build_logs/infrastructure/build-log-repository";
import { DrizzleClienteRepository } from "@/clientes/infrastructure/cliente-repository";
import { criarEventDispatcher } from "@/event_log/infrastructure/composicao";

export function criarDependenciasDeProjetos() {
  return {
    projetoRepository: new DrizzleProjetoRepository(),
    caseRepository: new DrizzleCaseRepository(),
    buildLogRepository: new DrizzleBuildLogRepository(),
    // Sprint 23B, item 1: buscar o nome do Cliente para exibição na
    // listagem de Projetos — o clienteId já era salvo, só não tinha
    // lookup nenhum antes disso (DOGFOODING_REPORT.md).
    clienteRepository: new DrizzleClienteRepository(),
    eventPublisher: criarEventDispatcher(),
  };
}
