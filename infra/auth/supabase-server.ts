import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@config/env";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

/**
 * Cliente Supabase para uso em Server Components e Server Actions.
 * Utilizado exclusivamente para Supabase Auth (ENGINEERING_MANIFEST.md /
 * stack aprovada: "Utilizando exclusivamente PostgreSQL, Supabase Auth,
 * Supabase Storage — não utilizar Edge Functions nem lógica de negócio
 * no Supabase").
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado a partir de um Server Component — ignorado
            // intencionalmente; o middleware é responsável por
            // refrescar a sessão nesse caso.
          }
        },
      },
    }
  );
}
