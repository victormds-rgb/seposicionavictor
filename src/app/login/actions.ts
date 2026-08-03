"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@infra/auth/supabase-server";
import { logarFalhaEPropagar } from "@infra/logging/logger";

/**
 * Server Action de login — Sprint 0.
 * Infraestrutura de autenticação mínima; nenhuma regra de negócio
 * de domínio é tocada aqui.
 *
 * Nota (Sprint 14 — item 6): o try/catch cobre só a chamada ao
 * Supabase, nunca os `redirect()` — `redirect()` funciona lançando uma
 * exceção interna do Next.js que o próprio framework captura; se ela
 * caísse dentro deste catch, todo login/erro esperado seria logado
 * como falha real.
 */
export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  let resultado;
  try {
    const supabase = await createSupabaseServerClient();
    resultado = await supabase.auth.signInWithPassword({ email, password });
  } catch (erro) {
    logarFalhaEPropagar("signIn", erro);
  }

  if (resultado.error) {
    redirect(`/login?erro=${encodeURIComponent(resultado.error.message)}`);
  }

  redirect("/");
}
