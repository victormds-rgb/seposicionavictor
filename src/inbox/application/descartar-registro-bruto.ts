import type { RegistroBrutoRepository } from "@/inbox/domain/registro-bruto-repository";
import { podeSerDescartado } from "@/inbox/domain/registro-bruto";

export class RegistroBrutoNaoDescartavelError extends Error {}

/**
 * Nota de escopo: a lista fechada de 21 eventos do domínio (DOMAIN_MODEL.md,
 * revisão pós-DDD) não inclui um evento específico para descarte de
 * RegistroBruto. Como o ENGINEERING_MANIFEST.md proíbe criar eventos
 * novos sem aprovação explícita, esta transição de status NÃO gera
 * entrada em `event_log` nesta Sprint — apenas atualiza o status via
 * repositório. Sinalizado no relatório da Sprint 2 como possível
 * lacuna de catálogo de eventos, não resolvido unilateralmente aqui.
 */
export async function descartarRegistroBruto(
  registroBrutoId: string,
  deps: { registroBrutoRepository: RegistroBrutoRepository }
) {
  const registro = await deps.registroBrutoRepository.buscarPorId(registroBrutoId);
  if (!registro || !podeSerDescartado(registro)) {
    throw new RegistroBrutoNaoDescartavelError(
      `RegistroBruto ${registroBrutoId} não pode ser descartado no status atual.`
    );
  }

  await deps.registroBrutoRepository.atualizarStatus(registroBrutoId, "descartado");
}
