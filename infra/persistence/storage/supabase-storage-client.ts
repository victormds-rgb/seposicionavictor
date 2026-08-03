import { createClient } from "@supabase/supabase-js";
import { env } from "@config/env";

/**
 * Cliente Supabase com service role, usado exclusivamente por
 * adapters de Infrastructure que precisam gravar em Supabase Storage
 * (stack aprovada: "Utilizando exclusivamente PostgreSQL, Supabase
 * Auth, Supabase Storage"). Nunca usado para lógica de negócio —
 * apenas upload/leitura de arquivo bruto.
 */
export function createSupabaseServiceClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
