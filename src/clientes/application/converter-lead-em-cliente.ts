import { z } from "zod";
import type { LeadRepository } from "@/pipeline_comercial/domain/lead-repository";
import { podeSerConvertido } from "@/pipeline_comercial/domain/lead";
import type { ClienteRepository } from "@/clientes/domain/cliente-repository";
import { avaliarCliente } from "@/clientes/domain/regra-de-decisao-cliente";
import { passouPelaArvoreCompleta } from "@/clientes/domain/cliente";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class LeadNaoEncontradoError extends Error {}
export class TransicaoInvalidaError extends Error {}

const converterLeadEmClienteSchema = z.object({
  leadId: z.string().uuid(),
  nome: z.string().trim().min(1).optional(),
  setor: z.string().trim().optional(),
  temAutoridadeReal: z.boolean(),
  aceitaDiagnostico: z.boolean(),
  sinalNaoCumprimento: z.boolean(),
});

export type ConverterLeadEmClienteInput = z.infer<typeof converterLeadEmClienteSchema>;

export interface ConverterLeadEmClienteDeps {
  leadRepository: LeadRepository;
  clienteRepository: ClienteRepository;
  eventPublisher?: IEventPublisher;
}

/**
 * Use Case central da Sprint 4: converte um Lead em Cliente aplicando
 * a árvore de decisão do Cap. 7.1 do SOM como "fluxo guiado"
 * (UI_UX.md, seção 7 — nesta Sprint, implementado como um único
 * formulário com as 3 perguntas visíveis simultaneamente, em vez de
 * telas sequenciais — simplificação documentada, não uma tela por
 * pergunta).
 *
 * Invariante (ADR-006): Lead e Cliente permanecem entidades distintas
 * — o Cliente resultante referencia `origemLeadId`, o Lead nunca é
 * apagado ou "virado" em Cliente.
 */
export async function converterLeadEmCliente(
  inputBruto: unknown,
  deps: ConverterLeadEmClienteDeps
) {
  const input = converterLeadEmClienteSchema.parse(inputBruto);

  const lead = await deps.leadRepository.buscarPorId(input.leadId);
  if (!lead) throw new LeadNaoEncontradoError(`Lead ${input.leadId} não encontrado.`);
  if (!podeSerConvertido(lead)) {
    throw new TransicaoInvalidaError(
      `Lead ${input.leadId} não pode ser convertido no status atual (${lead.statusComercial}).`
    );
  }

  const respostas = {
    temAutoridadeReal: input.temAutoridadeReal,
    aceitaDiagnostico: input.aceitaDiagnostico,
    sinalNaoCumprimento: input.sinalNaoCumprimento,
  };

  // A árvore completa é sempre respondida nesta única submissão —
  // logo a invariante "nunca ativo sem árvore completa" já é
  // satisfeita por construção neste fluxo.
  if (!passouPelaArvoreCompleta(respostas)) {
    throw new TransicaoInvalidaError("As três respostas da árvore de decisão são obrigatórias.");
  }

  const classificacaoResultante = avaliarCliente(respostas);

  const cliente = await deps.clienteRepository.criar({
    nome: input.nome ?? lead.nome,
    setor: input.setor ?? null,
    temAutoridadeReal: respostas.temAutoridadeReal,
    aceitaDiagnostico: respostas.aceitaDiagnostico,
    sinalNaoCumprimento: respostas.sinalNaoCumprimento,
    classificacaoResultante,
    urgenciaFinanceira: null,
    status: "ativo",
    origemLeadId: lead.id,
    metadata: null,
  });

  await deps.leadRepository.atualizarStatusComercial(input.leadId, "convertido_cliente");

  await deps.eventPublisher?.publicar({
    aggregate: "cliente",
    aggregateId: cliente.id,
    eventName: "cliente.avaliado",
    payload: { classificacaoResultante, origemLeadId: lead.id },
    actorTipo: "humano",
    source: "pipeline_comercial.converter_lead",
  });

  return cliente;
}
