import { sql } from "drizzle-orm";
import { getDb } from "@infra/persistence/db/client";
import { env } from "@config/env";
import { jobs } from "@infra/scheduler/jobs";
import packageJson from "../../../../package.json";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";

/**
 * Configurações — Central de Configurações (Sprint 18 — Product
 * Polish), redesenhada na Sprint de UX/UI para não destoar
 * visualmente do resto do produto.
 *
 * Substitui o stub "Módulo ainda não implementado" (auditoria de release,
 * achado Médio #1) por informações reais e verificáveis do sistema —
 * nenhuma configuração editável é criada aqui (não solicitado, não
 * inventado). Página autenticada (dentro do Shell), então mostra mais
 * detalhe que o `/health` público — mas ainda assim nunca imprime valor
 * de credencial, só se está configurada.
 */

interface StatusChecagem {
  status: "ok" | "erro";
  latenciaMs: number;
  detalhe?: string;
}

async function checarBanco(): Promise<StatusChecagem> {
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 py-2 text-sm last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-900">{value}</span>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const banco = await checarBanco();
  const nomesDosJobs = Object.keys(jobs);

  return (
    <div>
      <PageHeader title="Configurações" description="Informações do sistema — nenhum campo aqui é editável." />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Produto">
            <InfoRow label="Nome" value="FDE" />
            <InfoRow label="Versão" value={packageJson.version} />
            <InfoRow label="Ambiente" value={env.NODE_ENV} />
          </Section>

          <Section title="Banco de dados">
            <InfoRow
              label="Status"
              value={
                <Badge variant={banco.status === "ok" ? "success" : "danger"}>
                  {banco.status === "ok" ? "Conectado" : "Falha na conexão"}
                </Badge>
              }
            />
            <InfoRow label="Latência" value={`${banco.latenciaMs}ms`} />
            {banco.detalhe && <InfoRow label="Detalhe" value={banco.detalhe} />}
          </Section>
        </div>

        <Section title="IA">
          <InfoRow
            label="Provedor configurado"
            value={
              <Badge variant={env.OPENAI_API_KEY ? "success" : "neutral"}>
                {env.OPENAI_API_KEY ? "OpenAI" : "Não configurado"}
              </Badge>
            }
          />
          {!env.OPENAI_API_KEY && (
            <p className="mt-2 text-xs text-zinc-500">
              {env.NODE_ENV !== "production"
                ? "Sem chave configurada: classificação da Inbox usa o modo fake (determinístico, sem rede)."
                : "Sem chave configurada: a classificação da Inbox falhará ao ser usada."}
            </p>
          )}
        </Section>

        <Section title="Scheduler">
          <p className="text-sm text-zinc-700">
            {nomesDosJobs.length} job(s) registrado(s): {nomesDosJobs.join(", ")}.
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Não há processo de agendamento persistente rodando dentro da aplicação — cada Job é
            invocado manualmente (<code className="rounded bg-zinc-100 px-1 py-0.5">npm run jobs:run -- &lt;nome&gt;</code>)
            ou por um agendador externo (ver <code className="rounded bg-zinc-100 px-1 py-0.5">DEPLOY_VERCEL.md</code>).
            Esta página não tem como saber quando cada Job rodou pela última vez.
          </p>
        </Section>

        <Section title="Documentação">
          <ul className="space-y-1 text-sm text-zinc-700">
            <li>README.md — visão geral, instalação, operação</li>
            <li>docs/ARCHITECTURE.md — arquitetura, Bounded Contexts, ADRs</li>
            <li>docs/DATABASE.md — schema de banco (fonte de verdade)</li>
            <li>DEPLOY_VERCEL.md — guia de deploy</li>
            <li>PRODUCTION_ENV.md — variáveis de ambiente de produção</li>
            <li>FIRST_RUN.md — roteiro guiado do fluxo completo</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
