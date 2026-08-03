import type { Config } from "drizzle-kit";

// Configuração do Drizzle ORM — Sprint 0.
// O schema é a representação literal das tabelas já definidas em
// DATABASE.md (documento congelado). Nenhuma tabela é criada aqui
// que não esteja explicitamente especificada lá.
export default {
  schema: "./infra/persistence/db/schema/*.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
  strict: true,
  verbose: true,
} satisfies Config;
