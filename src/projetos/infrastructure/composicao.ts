import { DrizzleProjetoRepository } from "@/projetos/infrastructure/projeto-repository";
import { DrizzleCaseRepository } from "@/cases/infrastructure/case-repository";
import { DrizzleBuildLogRepository } from "@/build_logs/infrastructure/build-log-repository";
import { criarEventDispatcher } from "@/event_log/infrastructure/composicao";

export function criarDependenciasDeProjetos() {
  return {
    projetoRepository: new DrizzleProjetoRepository(),
    caseRepository: new DrizzleCaseRepository(),
    buildLogRepository: new DrizzleBuildLogRepository(),
    eventPublisher: criarEventDispatcher(),
  };
}
