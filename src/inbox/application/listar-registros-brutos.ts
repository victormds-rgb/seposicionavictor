import type {
  RegistroBrutoRepository,
  FiltrosRegistroBruto,
} from "@/inbox/domain/registro-bruto-repository";

/**
 * Query de leitura — busca e filtros da Inbox (IMPLEMENTATION_PLAN.md,
 * Sprint 2; UI_UX.md, seção 6). Nunca altera estado
 * (CODING_GUIDELINES.md, seção 5 — Queries).
 */
export async function listarRegistrosBrutos(
  filtros: FiltrosRegistroBruto,
  deps: { registroBrutoRepository: RegistroBrutoRepository }
) {
  return deps.registroBrutoRepository.listar(filtros);
}
