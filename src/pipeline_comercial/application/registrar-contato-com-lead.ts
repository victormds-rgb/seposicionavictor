import { z } from "zod";
import type { LeadRepository } from "@/pipeline_comercial/domain/lead-repository";
import { estaAtivo } from "@/pipeline_comercial/domain/lead";
import type { Clock } from "@/shared/domain/clock";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

export class LeadNaoEncontradoError extends Error {}
export class TransicaoInvalidaError extends Error {}

const registrarContatoComLeadSchema = z.object({
  leadId: z.string().uuid(),
});

/**
 * Use Case: mecanismo explícito mínimo para registrar que um contato
 * comercial real aconteceu com o Lead, fora dos fluxos que já
 * disparam isso automaticamente (`qualificarLead`,
 * `marcarLeadComoReunido`) — por exemplo, uma ligação ou mensagem
 * trocada que ainda não virou uma qualificação formal.
 *
 * Deliberadamente não aceita nenhum outro dado (nem texto livre) —
 * é só um carimbo de tempo. Registrar o CONTEÚDO da interação continua
 * sendo papel da Inbox (`registroBruto`) ou da qualificação; este Use
 * Case só resolve "quando foi a última vez que alguém falou com esse
 * lead", que hoje (Sprint 41) não tinha nenhuma fonte confiável.
 */
export async function registrarContatoComLead(
  inputBruto: unknown,
  deps: { leadRepository: LeadRepository; clock: Clock; eventPublisher?: IEventPublisher }
) {
  const input = registrarContatoComLeadSchema.parse(inputBruto);

  const lead = await deps.leadRepository.buscarPorId(input.leadId);
  if (!lead) throw new LeadNaoEncontradoError(`Lead ${input.leadId} não encontrado.`);
  if (!estaAtivo(lead)) {
    throw new TransicaoInvalidaError(
      `Lead ${input.leadId} já está resolvido (${lead.statusComercial}) — não faz sentido registrar contato.`
    );
  }

  const agora = deps.clock.now();
  await deps.leadRepository.registrarContato(input.leadId, agora);

  await deps.eventPublisher?.publicar({
    aggregate: "lead",
    aggregateId: input.leadId,
    eventName: "lead.contato_registrado",
    payload: { contatoEm: agora.toISOString() },
    actorTipo: "humano",
    source: "pipeline_comercial.registrar_contato_com_lead",
  });
}
