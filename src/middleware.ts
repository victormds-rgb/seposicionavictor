import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@config/env";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

/**
 * Middleware global de autenticação — Sprint 0.
 *
 * Sistema pessoal, usuário único (SOFTWARE_SPEC.md, seção 2 — Persona
 * única). Não há papéis ou permissões diferenciadas: qualquer sessão
 * autenticada é a sessão de Victor. O único objetivo aqui é impedir
 * acesso não autorizado (IMPLEMENTATION_PLAN.md, Sprint 0, critério
 * de aceite), não implementar navegação (Sprint 1).
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /health precisa ser público (Sprint 12 — Produção/Operação):
  // ferramentas de monitoramento/orquestração não têm sessão de
  // usuário para autenticar.
  const isRotaPublica =
    request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname === "/health";

  if (!user && !isRotaPublica) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
