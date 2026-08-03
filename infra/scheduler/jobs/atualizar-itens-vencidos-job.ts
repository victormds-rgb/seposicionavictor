import { atualizarItensVencidos } from "@/agenda/application/atualizar-itens-vencidos";
import { criarDependenciasDaAgenda } from "@/agenda/infrastructure/composicao";
import { SystemClock } from "@/shared/infrastructure/system-clock";

const clock = new SystemClock();

/**
 * Job: verificação de ItemDeAgenda vencido (ARCHITECTURE.md, seção 12).
 *
 * Idempotente — só atualiza itens que ainda estão `agendado` e cuja
 * data/hora já passou (`podeSerMarcadoComoPerdido`); reexecutar não
 * altera itens já marcados como `perdido`.
 *
 * Independente de interface — antes rodava a cada carregamento da
 * página /agenda; agora monta suas próprias dependências e pode ser
 * chamado sem nenhum Server Component envolvido.
 *
 * Chamável manualmente (`npm run jobs:run -- atualizar-itens-vencidos`)
 * e pronto para um scheduler externo futuro (Trigger.dev ou
 * equivalente), sem acoplamento a essa ferramenta.
 */
export async function jobAtualizarItensVencidos() {
  const deps = criarDependenciasDaAgenda();
  return atualizarItensVencidos(clock.now(), deps);
}
