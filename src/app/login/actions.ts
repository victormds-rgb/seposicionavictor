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

  // Redireciona direto para /dashboard (Sprint 15 — Green Deploy): "/"
  // é só um redirect-through para "/dashboard" (RootPage, src/app/page.tsx)
  // — pular esse salto intermediário evita um redirect() encadeado
  // dentro da mesma transição client-side do Server Action, que em
  // build de produção quebrava com "client-side exception" no client
  // router do Next.js. O destino final é o mesmo de sempre.
  redirect("/dashboard");
}
