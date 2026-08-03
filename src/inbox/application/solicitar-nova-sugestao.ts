import type { RegistroBrutoRepository } from "@/inbox/domain/registro-bruto-repository";
import type { SugestaoIARepository } from "@/ia/domain/sugestao-ia-repository";
import type { PortaDeIA } from "@/ia/domain/porta-de-ia";
import { classificarRegistroBruto } from "./classificar-registro-bruto";

export interface SolicitarNovaSugestaoDeps {
  registroBrutoRepository: RegistroBrutoRepository;
  sugestaoIARepository: SugestaoIARepository;
  portaDeIA: PortaDeIA;
}

export class SugestaoNaoRejeitadaError extends Error {}

/**
 * "Solicitar nova sugestão" (INTERACTION_MODEL.md, seção 11): gera uma
 * nova SugestaoIA para o mesmo RegistroBruto sem perder o registro da
 * sugestão anterior (que permanece marcada como `rejeitada`).
 */
export async function solicitarNovaSugestao(
  sugestaoAnteriorId: string,
  deps: SolicitarNovaSugestaoDeps
) {
  const sugestaoAnterior = await deps.sugestaoIARepository.buscarPorId(sugestaoAnteriorId);
  if (!sugestaoAnterior || sugestaoAnterior.status !== "rejeitada") {
    throw new SugestaoNaoRejeitadaError(
      "Só é possível solicitar nova sugestão para uma SugestaoIA já rejeitada."
    );
  }

  return classificarRegistroBruto(sugestaoAnterior.entidadeOrigemId, {
    registroBrutoRepository: deps.registroBrutoRepository,
    portaDeIA: deps.portaDeIA,
    sugestaoIARepository: deps.sugestaoIARepository,
  });
}
