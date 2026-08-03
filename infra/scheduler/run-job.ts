import { jobs, type NomeDoJob } from "./jobs";

/**
 * Executor manual dos Jobs do Scheduler durante desenvolvimento
 * (`npm run jobs:run -- <nome-do-job>`), no mesmo padrão de
 * `infra/persistence/db/migrate.ts` e `seed.ts`.
 *
 * Não é o scheduler em si — apenas o executor local. Um scheduler
 * externo futuro (Trigger.dev ou equivalente) chamaria as funções de
 * `infra/scheduler/jobs` diretamente, sem passar por este arquivo.
 */
async function run() {
  const nome = process.argv[2] as NomeDoJob | undefined;

  if (!nome || !(nome in jobs)) {
    console.error(
      `Uso: npm run jobs:run -- <nome-do-job>\nJobs disponíveis: ${Object.keys(jobs).join(", ")}`
    );
    process.exit(1);
    return;
  }

  console.log(`Executando job "${nome}"...`);
  const resultado = await jobs[nome]();
  console.log(`Job "${nome}" concluído.`, resultado);
  process.exit(0);
}

run().catch((error) => {
  console.error("Falha ao executar job:", error);
  process.exit(1);
});
