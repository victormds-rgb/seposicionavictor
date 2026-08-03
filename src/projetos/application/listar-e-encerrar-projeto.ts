import type { ProjetoRepository, FiltrosProjeto } from "@/projetos/domain/projeto-repository";
import { podeSerEncerrado } from "@/projetos/domain/projeto";

export class ProjetoNaoEncontradoError extends Error {}
export class TransicaoInvalidaError extends Error {}

export async function listarProjetos(
  filtros: FiltrosProjeto,
  deps: { projetoRepository: ProjetoRepository }
) {
  return deps.projetoRepository.listar(filtros);
}

export async function encerrarProjeto(
  projetoId: string,
  deps: { projetoRepository: ProjetoRepository }
) {
  const projeto = await deps.projetoRepository.buscarPorId(projetoId);
  if (!projeto) throw new ProjetoNaoEncontradoError(`Projeto ${projetoId} não encontrado.`);
  if (!podeSerEncerrado(projeto)) {
    throw new TransicaoInvalidaError(`Projeto ${projetoId} já está encerrado.`);
  }

  await deps.projetoRepository.atualizarStatus(projetoId, "encerrado");
}
