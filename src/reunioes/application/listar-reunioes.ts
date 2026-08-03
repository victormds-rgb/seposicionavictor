import type { ReuniaoRepository, FiltrosReuniao } from "@/reunioes/domain/reuniao-repository";

export async function listarReunioes(
  filtros: FiltrosReuniao,
  deps: { reuniaoRepository: ReuniaoRepository }
) {
  return deps.reuniaoRepository.listar(filtros);
}
