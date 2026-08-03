import { createBrowserClient } from "@supabase/ssr";
import { env } from "@config/env";

/**
 * Cliente Supabase para uso em Client Components — restrito a
 * autenticação (login/logout), conforme stack aprovada.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
