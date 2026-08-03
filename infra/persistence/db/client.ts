import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@config/env";
import * as schema from "./schema";

/**
 * Cliente único de conexão ao banco (Supabase Postgres).
 * Infrastructure pura — nenhuma regra de negócio vive aqui
 * (CODING_GUIDELINES.md, seção 6).
 *
 * Configuração de pool (Sprint 14 — Hardening Final): em produção
 * (`NODE_ENV=production`), assume ambiente serverless — cada instância
 * de função abre seu próprio pool, então `max` fica baixo (1) para não
 * esgotar o limite de conexões do Postgres com poucas invocações
 * concorrentes, e `prepare: false` porque o pooler transaction-mode da
 * Supabase (porta 6543, recomendado para DATABASE_URL em produção) não
 * suporta prepared statements. Em desenvolvimento, o comportamento é
 * idêntico ao de antes desta Sprint (`max: 10`, prepared statements
 * habilitados) — nenhuma mudança sem `NODE_ENV=production`.
 * `DATABASE_POOL_MAX` permite sobrescrever o valor calculado sem
 * alterar código, para qualquer ambiente.
 */
const isProducao = env.NODE_ENV === "production";

const queryClient = postgres(env.DATABASE_URL, {
  max: env.DATABASE_POOL_MAX ?? (isProducao ? 1 : 10),
  idle_timeout: isProducao ? 20 : undefined,
  prepare: !isProducao,
});

export const db = drizzle(queryClient, { schema });

type TransactionCallback = Parameters<typeof db.transaction>[0];
export type DbTransaction = Parameters<TransactionCallback>[0];

const contextoDeTransacao = new AsyncLocalStorage<DbTransaction>();

/**
 * Cliente de banco ativo no escopo atual: a transação em andamento
 * (dentro de `executarNaTransacao`, usado pela `DrizzleUnitOfWork`) ou
 * o pool compartilhado fora de qualquer transação. Repositórios devem
 * chamar esta função a cada operação — nunca importar `db`
 * diretamente — para participarem automaticamente de uma Unit of Work
 * sem receber a transação como parâmetro explícito.
 */
export function getDb(): typeof db | DbTransaction {
  return contextoDeTransacao.getStore() ?? db;
}

export function executarNaTransacao<T>(tx: DbTransaction, work: () => Promise<T>): Promise<T> {
  return contextoDeTransacao.run(tx, work);
}
