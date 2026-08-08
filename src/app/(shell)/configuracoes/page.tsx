import { sql } from "drizzle-orm";
import { getDb } from "@infra/persistence/db/client";
import { env } from "@config/env";
import { jobs } from "@infra/scheduler/jobs";
import packageJson from "../../../../package.json";

/**
 * Configurações — Central de Configurações (Sprint 18 — Product Polish).
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

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const banco = await checarBanco();
  const nomesDosJobs = Object.keys(jobs);

  return (
    <div>
      <h1>Configurações</h1>
      <p>Informações do sistema — nenhum campo aqui é editável.</p>

      <section aria-labelledby="produto">
        <h2 id="produto">Produto</h2>
        <dl>
          <dt>Nome</dt>
          <dd>MeuCMO</dd>
          <dt>Versão atual</dt>
          <dd>{packageJson.version}</dd>
        </dl>
      </section>

      <section aria-labelledby="sistema">
        <h2 id="sistema">Sistema</h2>
        <dl>
          <dt>Versão</dt>
          <dd>{packageJson.version}</dd>
          <dt>Ambiente</dt>
          <dd>{env.NODE_ENV}</dd>
        </dl>
      </section>

      <section aria-labelledby="banco">
        <h2 id="banco">Banco de dados</h2>
        <dl>
          <dt>Status</dt>
          <dd>{banco.status === "ok" ? "Conectado" : "Falha na conexão"}</dd>
          <dt>Latência</dt>
          <dd>{banco.latenciaMs}ms</dd>
          {banco.detalhe && (
            <>
              <dt>Detalhe</dt>
              <dd>{banco.detalhe}</dd>
            </>
          )}
        </dl>
      </section>

      <section aria-labelledby="scheduler">
        <h2 id="scheduler">Scheduler</h2>
        <p>
          {nomesDosJobs.length} job(s) registrado(s): {nomesDosJobs.join(", ")}.
        </p>
        <p>
          Não há processo de agendamento persistente rodando dentro da
          aplicação — cada Job é invocado manualmente
          (<code>npm run jobs:run -- &lt;nome&gt;</code>) ou por um
          agendador externo (ver <code>DEPLOY_VERCEL.md</code>). Esta
          página não tem como saber quando cada Job rodou pela última vez.
        </p>
      </section>

      <section aria-labelledby="ia">
        <h2 id="ia">IA</h2>
        <dl>
          <dt>Provedor configurado</dt>
          <dd>{env.OPENAI_API_KEY ? "Sim (OpenAI)" : "Não"}</dd>
        </dl>
        {!env.OPENAI_API_KEY && env.NODE_ENV !== "production" && (
          <p>Sem chave configurada: classificação da Inbox usa o modo fake (determinístico, sem rede).</p>
        )}
        {!env.OPENAI_API_KEY && env.NODE_ENV === "production" && (
          <p>Sem chave configurada: a classificação da Inbox falhará ao ser usada.</p>
        )}
      </section>

      <section aria-labelledby="documentacao">
        <h2 id="documentacao">Documentação</h2>
        <ul>
          <li>README.md — visão geral, instalação, operação</li>
          <li>docs/ARCHITECTURE.md — arquitetura, Bounded Contexts, ADRs</li>
          <li>docs/DATABASE.md — schema de banco (fonte de verdade)</li>
          <li>DEPLOY_VERCEL.md — guia de deploy</li>
          <li>PRODUCTION_ENV.md — variáveis de ambiente de produção</li>
          <li>FIRST_RUN.md — roteiro guiado do fluxo completo</li>
        </ul>
      </section>
    </div>
  );
}
