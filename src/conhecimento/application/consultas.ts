import type {
  FrameworkRepository,
  TemaMapeadoRepository,
  AtivoDeConhecimentoRepository,
  RegraDeDecisaoRepository,
} from "@/conhecimento/domain/conhecimento-repository";
import type { TipoAtivoConhecimento } from "@/conhecimento/domain/ativo-de-conhecimento";

export async function listarFrameworks(deps: { frameworkRepository: FrameworkRepository }) {
  return deps.frameworkRepository.listar();
}

export async function listarTemasMapeados(deps: { temaMapeadoRepository: TemaMapeadoRepository }) {
  return deps.temaMapeadoRepository.listar();
}

export async function listarAtivosDeConhecimento(
  filtros: { tipo?: TipoAtivoConhecimento },
  deps: { ativoDeConhecimentoRepository: AtivoDeConhecimentoRepository }
) {
  return deps.ativoDeConhecimentoRepository.listar(filtros);
}

export async function listarRegrasDeDecisao(deps: { regraDeDecisaoRepository: RegraDeDecisaoRepository }) {
  return deps.regraDeDecisaoRepository.listar();
}
