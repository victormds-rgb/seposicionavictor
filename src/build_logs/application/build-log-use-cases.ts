import { z } from "zod";
import type { BuildLogRepository } from "@/build_logs/domain/build-log-repository";
import { os4CamposCompletos, podeSerPublicado } from "@/build_logs/domain/build-log";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class BuildLogNaoEncontradoError extends Error {}
export class BuildLogNaoPodePublicarError extends Error {}

const criarBuildLogSchema = z.object({
  projetoId: z.string().uuid(),
  contexto: z.string().trim().optional(),
  quebra: z.string().trim().optional(),
  decisao: z.string().trim().optional(),
  proximoPasso: z.string().trim().optional(),
});

export async function criarBuildLog(
  inputBruto: unknown,
  deps: { buildLogRepository: BuildLogRepository; eventPublisher?: IEventPublisher }
) {
  const input = criarBuildLogSchema.parse(inputBruto);

  return deps.buildLogRepository.criar({
    projetoId: input.projetoId,
    contexto: input.contexto ?? null,
    quebra: input.quebra ?? null,
    decisao: input.decisao ?? null,
    proximoPasso: input.proximoPasso ?? null,
    status: "rascunho",
    dataPublicacao: null,
    metadata: null,
  });
}

const atualizarCamposSchema = z.object({
  buildLogId: z.string().uuid(),
  contexto: z.string().trim().optional(),
  quebra: z.string().trim().optional(),
  decisao: z.string().trim().optional(),
  proximoPasso: z.string().trim().optional(),
});

export async function atualizarCamposDoBuildLog(
  inputBruto: unknown,
  deps: { buildLogRepository: BuildLogRepository }
) {
  const input = atualizarCamposSchema.parse(inputBruto);

  await deps.buildLogRepository.atualizarCampos(input.buildLogId, {
    contexto: input.contexto,
    quebra: input.quebra,
    decisao: input.decisao,
    proximoPasso: input.proximoPasso,
  });

  return deps.buildLogRepository.buscarPorId(input.buildLogId);
}

/**
 * Use Case: publicar um Build Log — só permitido com os 4 campos do
 * template preenchidos (SOM Cap. 4.4). Emite o evento catalogado
 * `build_log.publicado`.
 */
export async function publicarBuildLog(
  buildLogId: string,
  deps: { buildLogRepository: BuildLogRepository; eventPublisher?: IEventPublisher }
) {
  const log = await deps.buildLogRepository.buscarPorId(buildLogId);
  if (!log) throw new BuildLogNaoEncontradoError(`BuildLog ${buildLogId} não encontrado.`);
  if (!podeSerPublicado(log)) {
    throw new BuildLogNaoPodePublicarError(
      `BuildLog ${buildLogId} não pode ser publicado — os 4 campos precisam estar preenchidos e o status deve ser 'rascunho'.`
    );
  }

  const dataPublicacao = new Date();
  await deps.buildLogRepository.publicar(buildLogId, dataPublicacao);

  await deps.eventPublisher?.publicar({
    aggregate: "build_log",
    aggregateId: buildLogId,
    eventName: "build_log.publicado",
    payload: { projetoId: log.projetoId },
    actorTipo: "humano",
    source: "build_logs.publicar",
  });
}

export async function listarBuildLogsDoProjeto(
  projetoId: string,
  deps: { buildLogRepository: BuildLogRepository }
) {
  return deps.buildLogRepository.listarPorProjeto(projetoId);
}

// Reexportado para uso em testes de invariante isolado.
export { os4CamposCompletos };
