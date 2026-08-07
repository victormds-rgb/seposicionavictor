import { NextResponse, type NextRequest } from "next/server";
import { jobs, type NomeDoJob } from "@infra/scheduler/jobs";
import { env } from "@config/env";
import { logger } from "@infra/logging/logger";

export const dynamic = "force-dynamic";

/**
 * /api/cron/[job] — Sprint 30 (Scheduler automático).
 *
 * Único adapter HTTP para os Jobs já existentes em
 * `infra/scheduler/jobs/` — nenhuma lógica nova aqui, só invoca
 * exatamente a mesma função que `npm run jobs:run -- <job>` chama
 * manualmente (`infra/scheduler/run-job.ts`). `vercel.json` aciona
 * esta rota pelo Vercel Cron; o Job continua "independente de
 * ferramenta de agendamento" (ARCHITECTURE.md, seção 12) — o Cron só
 * decide QUANDO chamar, não COMO o Job funciona.
 *
 * Autenticação: Vercel Cron envia automaticamente
 * `Authorization: Bearer $CRON_SECRET` quando essa env var existe no
 * projeto (documentação da Vercel) — comparação exigida em toda
 * chamada; sem `CRON_SECRET` configurado, a rota recusa tudo
 * (fail-closed, nunca roda um Job sem conseguir autenticar quem
 * pediu). `isRotaPublica` em `src/proxy.ts` deixa a requisição chegar
 * até aqui sem sessão Supabase — o Cron não tem cookie nenhum.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ job: string }> }) {
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const { job } = await params;
  if (!(job in jobs)) {
    return NextResponse.json({ erro: `Job "${job}" não existe.` }, { status: 404 });
  }

  try {
    const resultado = await jobs[job as NomeDoJob]();
    return NextResponse.json({ job, status: "concluido", resultado });
  } catch (erro) {
    logger.error(`cron.${job}: falhou`, { erro: erro instanceof Error ? erro.message : String(erro) });
    return NextResponse.json({ job, status: "falhou" }, { status: 500 });
  }
}
