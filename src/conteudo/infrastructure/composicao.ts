import { DrizzlePecaDeConteudoRepository } from "@/conteudo/infrastructure/peca-de-conteudo-repository";
import {
  DrizzlePilarRepository,
  DrizzleSerieFixaRepository,
} from "@/conteudo/infrastructure/pilar-e-serie-fixa-repository";
import { criarEventDispatcher } from "@/event_log/infrastructure/composicao";

export function criarDependenciasDeConteudo() {
  return {
    pecaDeConteudoRepository: new DrizzlePecaDeConteudoRepository(),
    pilarRepository: new DrizzlePilarRepository(),
    serieFixaRepository: new DrizzleSerieFixaRepository(),
    eventPublisher: criarEventDispatcher(),
  };
}
