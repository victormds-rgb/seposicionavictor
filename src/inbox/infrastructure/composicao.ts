import { DrizzleRegistroBrutoRepository } from "@/inbox/infrastructure/registro-bruto-repository";
import { SupabaseArmazenamentoBinario } from "@/inbox/infrastructure/armazenamento-supabase";
import { DrizzleSugestaoIARepository } from "@/ia/infrastructure/sugestao-ia-repository";
import { OpenAIPortaDeIA } from "@/ia/infrastructure/providers/openai-provider";
import { FakeLocalPortaDeIA } from "@/ia/infrastructure/providers/fake-local-porta-de-ia";
import type { PortaDeIA } from "@/ia/domain/porta-de-ia";
import { criarEventDispatcher } from "@/event_log/infrastructure/composicao";
import { SystemUuidGenerator } from "@/shared/infrastructure/system-uuid-generator";
import { env } from "@config/env";

/**
 * Raiz de composição do Bounded Context Inbox — único lugar onde as
 * implementações concretas de Infrastructure são instanciadas e
 * injetadas nos Use Cases da Application (CODING_GUIDELINES.md,
 * seção 2). Server Actions e testes de integração usam este módulo;
 * testes unitários usam fakes em seu lugar.
 */

/**
 * Seleciona o adapter da Porta de IA (Sprint 12 — Produção/Operação;
 * Sprint 31A — migrado para OpenAI, único provedor do projeto).
 *
 * Em produção, o comportamento é idêntico ao de sempre: sempre
 * `OpenAIPortaDeIA`, que lança erro se `OPENAI_API_KEY` não estiver
 * configurada. Só fora de produção, e só quando a chave está ausente,
 * cai no adapter fake — nunca silenciosamente em produção.
 */
function criarPortaDeIA(): PortaDeIA {
  if (!env.OPENAI_API_KEY && env.NODE_ENV !== "production") {
    return new FakeLocalPortaDeIA();
  }
  return new OpenAIPortaDeIA();
}

export function criarDependenciasDaInbox() {
  const uuidGenerator = new SystemUuidGenerator();

  return {
    registroBrutoRepository: new DrizzleRegistroBrutoRepository(),
    portaDeArmazenamento: new SupabaseArmazenamentoBinario(uuidGenerator),
    portaDeIA: criarPortaDeIA(),
    sugestaoIARepository: new DrizzleSugestaoIARepository(),
    eventPublisher: criarEventDispatcher(),
    uuidGenerator,
  };
}
