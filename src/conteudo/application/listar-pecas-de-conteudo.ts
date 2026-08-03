import type {
  PecaDeConteudoRepository,
  FiltrosPecaDeConteudo,
} from "@/conteudo/domain/peca-de-conteudo-repository";

export async function listarPecasDeConteudo(
  filtros: FiltrosPecaDeConteudo,
  deps: { pecaDeConteudoRepository: PecaDeConteudoRepository }
) {
  return deps.pecaDeConteudoRepository.listar(filtros);
}
