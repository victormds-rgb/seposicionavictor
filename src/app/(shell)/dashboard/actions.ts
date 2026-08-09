"use server";

import { createSupabaseServerClient } from "@infra/auth/supabase-server";
import { logger } from "@infra/logging/logger";

/**
 * Sprint 39 (Memória Executiva REAL) — registra QUANDO a visita atual
 * ao Dashboard aconteceu, para a PRÓXIMA visita poder comparar contra
 * este ponto. Guardado em `user_metadata` do Supabase Auth — o único
 * lugar de identidade que já existe neste sistema de usuário único
 * (não há tabela própria de usuário/sessão/workspace; ver relatório
 * da Sprint 39, investigação, itens 1-2).
 *
 * Chamado só depois que a página já renderizou de verdade no
 * navegador (src/app/(shell)/dashboard/_components/registrar-visita.tsx,
 * via useEffect) — nunca durante o render do Server Component em si,
 * para não contar um prefetch de <Link> como visita real (ver
 * node_modules/next/dist/docs/01-app/02-guides/prefetching.md,
 * seção "Triggering unwanted side-effects during prefetching").
 *
 * Best-effort deliberado: se isto falhar, a única consequência é a
 * próxima "Desde sua última visita" comparar contra um ponto mais
 * antigo do que o ideal — nunca vale derrubar a página por causa
 * disso, então não relança o erro (diferente do padrão
 * `logarFalhaEPropagar` usado nas demais Server Actions, que são
 * ligadas a formulários e devem propagar falha para o usuário ver).
 */
export async function registrarVisitaAoDashboardAction() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.updateUser({ data: { ultimaVisitaEm: new Date().toISOString() } });
  } catch (erro) {
    logger.warn("registrarVisitaAoDashboardAction: falhou, próxima comparação usará ponto antigo", {
      erro: erro instanceof Error ? erro.message : String(erro),
    });
  }
}
