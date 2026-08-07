import { listarItensAgenda } from "@/agenda/application/listar-itens-agenda";
import { criarDependenciasDaAgenda } from "@/agenda/infrastructure/composicao";
import { ROTINA_SEMANAL_FIXA } from "@/agenda/domain/item-agenda";
import { listarRegistrosBrutos } from "@/inbox/application/listar-registros-brutos";
import { criarDependenciasDaInbox } from "@/inbox/infrastructure/composicao";
import { calcularDistribuicaoDePilares } from "@/conteudo/application/calcular-distribuicao-de-pilares";
import { criarDependenciasDeConteudo } from "@/conteudo/infrastructure/composicao";
import { listarAlertas } from "@/notificacoes/application/gestao-de-alertas";
import { criarDependenciasDeNotificacoes } from "@/notificacoes/infrastructure/composicao";

/**
 * Dashboard — estrutura definida na Sprint 1 (UI_UX.md, seção 5),
 * completada na Sprint 9 com dados reais nas 4 seções, agora que
 * todos os módulos correspondentes existem (Agenda/Sprint 3,
 * Inbox/Sprint 2, Pilares/Sprint 6, Alertas/Sprint 9).
 *
 * Apenas consulta dados — o MonitorDeConsistencia roda como Job do
 * Scheduler (`infra/scheduler/jobs/monitor-de-consistencia-job.ts`),
 * não durante a renderização (Hardening, ARCHITECTURE.md, seção 12).
 */
export const dynamic = "force-dynamic";

/**
 * Sprint 23 — DOGFOODING_REPORT.md, item 3: sem isto, o Dashboard
 * mostrava só o tipo genérico "rotina_fixa", sem dizer qual atividade
 * é — obrigando abrir a Agenda para descobrir. A descrição já existia
 * como dado em ROTINA_SEMANAL_FIXA, só não estava sendo exibida aqui.
 */
function descreverItemDeAgenda(item: { tipo: string; rotinaFixaReferencia: string | null }): string {
  if (item.tipo === "rotina_fixa" && item.rotinaFixaReferencia) {
    const rotina = ROTINA_SEMANAL_FIXA.find((r) => r.referencia === item.rotinaFixaReferencia);
    if (rotina) return rotina.descricao;
  }
  return item.tipo;
}

export default async function DashboardPage() {
  const depsAgenda = criarDependenciasDaAgenda();
  const depsInbox = criarDependenciasDaInbox();
  const depsConteudo = criarDependenciasDeConteudo();
  const depsNotificacoes = criarDependenciasDeNotificacoes();

  const hoje = new Date();
  const inicioDoDia = new Date(hoje);
  inicioDoDia.setHours(0, 0, 0, 0);
  const fimDoDia = new Date(hoje);
  fimDoDia.setHours(23, 59, 59, 999);

  const itensDoDia = await listarItensAgenda(
    { de: inicioDoDia, ate: fimDoDia },
    { itemDeAgendaRepository: depsAgenda.itemDeAgendaRepository }
  );

  const pendenciasInbox = await listarRegistrosBrutos(
    { status: "classificacao_sugerida" },
    { registroBrutoRepository: depsInbox.registroBrutoRepository }
  );

  const distribuicao = await calcularDistribuicaoDePilares(undefined, depsConteudo);
  const desviosRelevantes = distribuicao.filter((d) => Math.abs(d.desvio) > 10);

  const alertasAtivos = await listarAlertas(
    { status: "ativo" },
    { alertaRepository: depsNotificacoes.alertaRepository }
  );

  return (
    <div>
      <h1>Dashboard</h1>

      <section aria-labelledby="agenda-do-dia">
        <h2 id="agenda-do-dia">Agenda do dia</h2>
        {itensDoDia.length === 0 ? (
          <p>Nenhum item de agenda hoje.</p>
        ) : (
          <ul>
            {itensDoDia.map((item) => (
              <li key={item.id}>
                {item.dataHora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} ·{" "}
                {descreverItemDeAgenda(item)} · {item.status}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="alertas-ativos">
        <h2 id="alertas-ativos">Alertas ativos ({alertasAtivos.length})</h2>
        {alertasAtivos.length === 0 ? (
          <p>Nenhum alerta ativo — tudo em dia.</p>
        ) : (
          <ul>
            {alertasAtivos.map((a) => (
              <li key={a.id}>
                <strong>{a.tipo}</strong>: {a.condicaoGatilho}
              </li>
            ))}
          </ul>
        )}
        <p>
          <a href="/alertas">Ver todos os alertas</a>
        </p>
      </section>

      <section aria-labelledby="pendencias-inbox">
        <h2 id="pendencias-inbox">Pendências da Inbox</h2>
        {pendenciasInbox.length === 0 ? (
          <p>Nenhuma pendência — Inbox em dia.</p>
        ) : (
          <p>
            {pendenciasInbox.length} registro(s) aguardando revisão de sugestão de IA.{" "}
            <a href="/inbox">Revisar agora</a>
          </p>
        )}
      </section>

      <section aria-labelledby="distribuicao-pilares">
        <h2 id="distribuicao-pilares">Distribuição de pilares</h2>
        {desviosRelevantes.length === 0 ? (
          <p>Distribuição de conteúdo alinhada à meta.</p>
        ) : (
          <ul>
            {desviosRelevantes.map((d) => (
              <li key={d.pilarId}>
                {d.nome}: desvio de {d.desvio > 0 ? "+" : ""}
                {d.desvio}% em relação à meta
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
