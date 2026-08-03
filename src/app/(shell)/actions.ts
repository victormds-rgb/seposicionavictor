"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@infra/auth/supabase-server";
import { logarFalhaEPropagar } from "@infra/logging/logger";

/**
 * Logout — reaproveita a autenticação já implementada na Sprint 0.
 * Não é funcionalidade nova de domínio; é infraestrutura de sessão
 * necessária para o Shell ser utilizável (sem isso, não haveria
 * caminho de volta ao /login).
 *
 * Nota (Sprint 14 — item 6): try/catch cobre só a chamada ao Supabase,
 * nunca o `redirect()` final (ver login/actions.ts para o motivo).
 */
export async function signOut() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (erro) {
    logarFalhaEPropagar("signOut", erro);
  }
  redirect("/login");
}
