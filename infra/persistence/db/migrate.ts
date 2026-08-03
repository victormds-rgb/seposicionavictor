import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@config/env";

/**
 * Executa as migrations pendentes em `migrations/` contra o banco
 * configurado em DATABASE_URL. Usado em desenvolvimento, homologação
 * e produção (IMPLEMENTATION_PLAN.md, seção 6 — Estratégia de Deploy).
 */
async function run() {
  const migrationClient = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);

  console.log("Aplicando migrations...");
  await migrate(db, { migrationsFolder: "./migrations" });
  console.log("Migrations aplicadas com sucesso.");

  await migrationClient.end();
}

run().catch((error) => {
  console.error("Falha ao aplicar migrations:", error);
  process.exit(1);
});
