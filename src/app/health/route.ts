import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@infra/persistence/db/client";
import { env } from "@config/env";
import { logger } from "@infra/logging/logger";

export const dynamic = "force-dynamic";

/**
 * /health — Sprint 12 (Produção/Operação), resposta pública endurecida
 * na Sprint 14 (Hardening Final, item 5).
 *
 * Rota pública (isenta de autenticação em src/middleware.ts) para
 * monitoramento/orquestração. Verifica os dois serviços dos quais a
 * aplicação genuinamente depende (Postgres e Supabase Auth), mas
 * NUNCA expõe stacktrace, mensagem do driver ou qualquer detalhe
 * interno na resposta — isso vai só para o `logger`. A resposta
 * pública é estritamente `{ "status": "ok" }` ou `{ "status": "erro" }`.
 */

interface ResultadoChecagem {
  status: "ok" | "erro";
  latenciaMs: number;
  detalhe?: string;
}

async function checarDatabase(): Promise<ResultadoChecagem> {
  const inicio = Date.now();
  try {
    await getDb().execute(sql`select 1`);
    return { status: "ok", latenciaMs: Date.now() - inicio };
  } catch (erro) {
    return {
      status: "erro",
      latenciaMs: Date.now() - inicio,
      detalhe: erro instanceof Error ? erro.message : "Falha desconhecida ao consultar o banco.",
    };
  }
}

async function checarSupabase(): Promise<ResultadoChecagem> {
  const inicio = Date.now();
  try {
    const controlador = new AbortController();
    const timeout = setTimeout(() => controlador.abort(), 5_000);

    const resposta = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
      signal: controlador.signal,
    });
    clearTimeout(timeout);

    if (!resposta.ok) {
      return {
        status: "erro",
        latenciaMs: Date.now() - inicio,
        detalhe: `Supabase Auth respondeu HTTP ${resposta.status}.`,
      };
    }
    return { status: "ok", latenciaMs: Date.now() - inicio };
  } catch (erro) {
    return {
      status: "erro",
      latenciaMs: Date.now() - inicio,
      detalhe: erro instanceof Error ? erro.message : "Falha desconhecida ao contatar o Supabase.",
    };
  }
}

export async function GET() {
  const [database, supabase] = await Promise.all([checarDatabase(), checarSupabase()]);

  const saudavel = database.status === "ok" && supabase.status === "ok";

  if (!saudavel) {
    logger.error("Healthcheck falhou", { database, supabase });
  }

  return NextResponse.json({ status: saudavel ? "ok" : "erro" }, { status: saudavel ? 200 : 503 });
}
