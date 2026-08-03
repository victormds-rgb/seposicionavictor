import type { RegistroBrutoRepository } from "@/inbox/domain/registro-bruto-repository";
import { podeSerClassificado } from "@/inbox/domain/registro-bruto";
import type { PortaDeIA } from "@/ia/domain/porta-de-ia";
import type { SugestaoIARepository } from "@/ia/domain/sugestao-ia-repository";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export interface ClassificarRegistroBrutoDeps {
  registroBrutoRepository: RegistroBrutoRepository;
  portaDeIA: PortaDeIA;
  sugestaoIARepository: SugestaoIARepository;
  eventPublisher?: IEventPublisher;
}

export class RegistroBrutoNaoEncontradoError extends Error {}
export class RegistroBrutoNaoClassificavelError extends Error {}

/**
 * Domain Service `ClassificadorDeRegistroBruto`, implementado como
 * Use Case da Application do contexto Inbox (ARCHITECTURE.md, seção 7).
 *
 * Nunca marca o RegistroBruto como `classificado` — apenas gera a
 * SugestaoIA e move o status para `classificacao_sugerida`, aguardando
 * confirmação humana (ADR-005; DOMAIN_MODEL.md, invariante do
 * RegistroBruto).
 */
export async function classificarRegistroBruto(
  registroBrutoId: string,
  deps: ClassificarRegistroBrutoDeps
) {
  const registro = await deps.registroBrutoRepository.buscarPorId(registroBrutoId);
  if (!registro) {
    throw new RegistroBrutoNaoEncontradoError(`RegistroBruto ${registroBrutoId} não encontrado.`);
  }
  if (!podeSerClassificado(registro)) {
    throw new RegistroBrutoNaoClassificavelError(
      `RegistroBruto ${registroBrutoId} não pode ser classificado no status atual (${registro.status}).`
    );
  }

  const inicio = Date.now();
  const classificacao = await deps.portaDeIA.classificarRegistroBruto(registro.conteudoTexto as string);
  const tempoRespostaMs = classificacao.tempoRespostaMs ?? Date.now() - inicio;

  const sugestao = await deps.sugestaoIARepository.criar({
    tipoSugestao: "classificacao",
    entidadeOrigemTipo: "registro_bruto",
    entidadeOrigemId: registro.id,
    entidadeAlvoTipo: null,
    entidadeAlvoId: null,
    conteudoSugerido: {
      tipoDestinoSugerido: classificacao.tipoDestinoSugerido,
      justificativa: classificacao.justificativa,
    },
    provider: classificacao.provider,
    modelo: classificacao.modelo,
    promptVersion: classificacao.promptVersion,
    temperatura: null,
    tokensInput: classificacao.tokensInput,
    tokensOutput: classificacao.tokensOutput,
    custoEstimado: classificacao.custoEstimado,
    tempoRespostaMs,
    confianca: classificacao.confianca,
    origemDaSugestao: "domain_service",
    status: "pendente",
  });

  await deps.registroBrutoRepository.atualizarStatus(registro.id, "classificacao_sugerida");

  await deps.eventPublisher?.publicar({
    aggregate: "sugestao_ia",
    aggregateId: sugestao.id,
    eventName: "sugestao.gerada",
    payload: {
      registroBrutoId: registro.id,
      tipoDestinoSugerido: classificacao.tipoDestinoSugerido,
      confianca: classificacao.confianca,
    },
    actorTipo: "ia",
    actorId: classificacao.modelo,
    source: "inbox.classificar",
  });

  return sugestao;
}
