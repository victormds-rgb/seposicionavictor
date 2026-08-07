import { z } from "zod";

/**
 * Única fonte de configuração de ambiente do projeto (Sprint 0;
 * validação completa endurecida na Sprint 12 — Produção/Operação).
 * Nenhuma credencial ou variável de ambiente deve ser lida diretamente
 * de `process.env` fora deste módulo (CODING_GUIDELINES.md, seção 6/11).
 *
 * Grupos (ver README.md, seção "Variáveis de ambiente", para o
 * significado operacional de cada uma — obtenção de credenciais,
 * onde configurar, o que quebra sem elas):
 * 1. Database
 * 2. Supabase
 * 3. OpenRouter (IA)
 * 4. Google (Calendar/Drive/Gmail — documentação operacional apenas,
 *    nenhuma integração nova implementada nesta Sprint)
 * 5. Playwright / E2E
 * 6. Runtime
 */
const envSchema = z.object({
  // ── 1. Database — Postgres (Supabase) via Drizzle ORM ──────────────
  DATABASE_URL: z.string().url({
    message: "DATABASE_URL ausente ou inválida — string de conexão Postgres do projeto Supabase.",
  }),
  // Opcional: sobrescreve o tamanho do pool escolhido automaticamente
  // por NODE_ENV (Sprint 14 — Hardening Final). Sem ela, o padrão é
  // seguro tanto em desenvolvimento quanto em produção serverless —
  // ver infra/persistence/db/client.ts.
  DATABASE_POOL_MAX: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().int().positive().optional()
  ),

  // ── 2. Supabase — Auth + Storage ────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: "NEXT_PUBLIC_SUPABASE_URL ausente ou inválida — URL do projeto Supabase.",
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
    message: "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente — chave anônima do projeto Supabase.",
  }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, {
    message: "SUPABASE_SERVICE_ROLE_KEY ausente — chave service_role do projeto Supabase.",
  }),
  SUPABASE_STORAGE_BUCKET_INBOX: z.string().min(1).default("inbox-arquivos"),

  // ── 3. OpenRouter — Porta de IA (src/ia/domain/porta-de-ia.ts) ─────
  // Opcional: sem ela, a classificação automática da Inbox lança erro
  // em produção; em desenvolvimento/teste, cai em modo fake (ver
  // src/ia/infrastructure/providers/fake-local-porta-de-ia.ts).
  // `.env.local` com a linha em branco ("OPENROUTER_API_KEY=") vira
  // string vazia, não ausência — normalizada para undefined antes do
  // `.min(1)` para não quebrar quando deixada de propósito em branco.
  OPENROUTER_API_KEY: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().min(1).optional()
  ),

  // ── 4. Google Workspace — Calendar/Drive/Gmail ──────────────────────
  // Documentação operacional completa: README.md, seção "Google
  // Workspace". Nenhuma integração nova nesta Sprint — apenas os
  // adapters já existentes (Brand Intelligence/Drive) continuam
  // opcionais; sem estas variáveis, falham de forma não-bloqueante
  // (ARCHITECTURE.md, seção 18).
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // ── 5b. Scheduler — Vercel Cron (infra/scheduler) ──────────────────
  // Opcional: sem ela, a rota /api/cron/[job] recusa toda requisição
  // (fail-closed — nunca roda um Job sem conseguir autenticar quem
  // pediu). Gerada por você (qualquer string aleatória longa) e
  // configurada também no painel da Vercel — o próprio Vercel Cron
  // envia esse valor automaticamente como
  // `Authorization: Bearer $CRON_SECRET` quando a env var existe no
  // projeto (ver README.md, seção "Jobs e Scheduler").
  CRON_SECRET: z.preprocess((v) => (v === "" ? undefined : v), z.string().min(1).optional()),

  // ── 5. Playwright / E2E (tests/e2e) ─────────────────────────────────
  // Só necessárias para rodar `npm run test:e2e` — usuário real do
  // Supabase Auth do projeto (nunca inventado pelos testes). Ver
  // README.md, seção "Testes E2E".
  E2E_USER_EMAIL: z.preprocess((v) => (v === "" ? undefined : v), z.string().email().optional()),
  E2E_USER_PASSWORD: z.preprocess((v) => (v === "" ? undefined : v), z.string().min(1).optional()),

  // ── 6. Runtime ───────────────────────────────────────────────────────
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const porCampo = parsed.error.flatten().fieldErrors;
    const variaveisAusentes = Object.keys(porCampo);
    const mensagensDetalhadas = Object.entries(porCampo)
      .map(([campo, mensagens]) => `  - ${campo}: ${mensagens?.join("; ") ?? "inválida"}`)
      .join("\n");

    // Falha de configuração é um erro de fundação — nunca deve ser
    // silenciosamente ignorada ou contornada com valor padrão inventado.
    // A variável exata ausente/inválida vai tanto no log quanto na
    // mensagem da exceção (que é o que normalmente aparece na tela de
    // erro do Next.js, nem sempre o log do processo).
    console.error("Configuração de ambiente inválida:", porCampo);
    throw new Error(
      `Variáveis de ambiente ausentes ou inválidas: ${variaveisAusentes.join(", ")}.\n` +
        `${mensagensDetalhadas}\n` +
        "Verifique .env.local contra .env.example (ver README.md, seção \"Variáveis de ambiente\")."
    );
  }

  return parsed.data;
}

export const env = loadEnv();
