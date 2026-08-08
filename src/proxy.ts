import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@config/env";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

/**
 * Proxy (middleware) global de autenticação — Sprint 0, renomeado de
 * `middleware.ts` para `proxy.ts` na Sprint 15 (Green Deploy) — o
 * convention de arquivo `middleware` foi depreciado no Next.js 16 em
 * favor de `proxy` (mesmo runtime, mesma função, só o nome muda).
 *
 * Sistema pessoal, usuário único (SOFTWARE_SPEC.md, seção 2 — Persona
 * única). Não há papéis ou permissões diferenciadas: qualquer sessão
 * autenticada é a sessão de Victor. O único objetivo aqui é impedir
 * acesso não autorizado (IMPLEMENTATION_PLAN.md, Sprint 0, critério
 * de aceite), não implementar navegação (Sprint 1).
 */
export async function proxy(request: NextRequest) {
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
  // usuário para autenticar. /api/cron (Sprint 30 — Scheduler) pelo
  // mesmo motivo: o Vercel Cron não tem cookie de sessão nenhum — a
  // própria rota se autentica via CRON_SECRET (Authorization: Bearer),
  // não via este Proxy.
  const isRotaPublica =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname === "/health" ||
    request.nextUrl.pathname.startsWith("/api/cron");

  if (!user && !isRotaPublica) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Sprint 32: manifest.json (public/manifest.json, identidade do
    // app) precisa ficar de fora pelo mesmo motivo dos ícones abaixo
    // — sem isto, era redirecionado para /login como qualquer outra
    // rota (achado real durante a validação em produção da Sprint 32).
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
