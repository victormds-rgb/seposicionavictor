import Link from "next/link";
import { listarItensAgenda } from "@/agenda/application/listar-itens-agenda";
import { criarDependenciasDaAgenda } from "@/agenda/infrastructure/composicao";
import { ROTINA_SEMANAL_FIXA } from "@/agenda/domain/item-agenda";
import { listarRegistrosBrutos } from "@/inbox/application/listar-registros-brutos";
import { criarDependenciasDaInbox } from "@/inbox/infrastructure/composicao";
import { calcularDistribuicaoDePilares } from "@/conteudo/application/calcular-distribuicao-de-pilares";
import { criarDependenciasDeConteudo } from "@/conteudo/infrastructure/composicao";
import { listarAlertas } from "@/notificacoes/application/gestao-de-alertas";
import { criarDependenciasDeNotificacoes } from "@/notificacoes/infrastructure/composicao";
import { listarLeads } from "@/pipeline_comercial/application/listar-leads";
import { criarDependenciasDoPipelineComercial } from "@/pipeline_comercial/infrastructure/composicao";
import { listarClientes } from "@/clientes/application/listar-clientes";
import { criarDependenciasDeClientes } from "@/clientes/infrastructure/composicao";
import { listarProjetos } from "@/projetos/application/listar-e-encerrar-projeto";
import { criarDependenciasDeProjetos } from "@/projetos/infrastructure/composicao";
import { listarPecasDeConteudo } from "@/conteudo/application/listar-pecas-de-conteudo";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

/**
 * Dashboard — estrutura definida na Sprint 1 (UI_UX.md, seção 5),
 * completada na Sprint 9 com dados reais, estilo Sprint 26.
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
  return item.tipo === "tarefa_com_prazo" ? "Tarefa com prazo" : "Reunião";
}

// Sprint 33.5 (Refinamento): rótulo legível para o tipo do Alerta —
// antes aparecia cru ("drift_critico", "desvio_pilares"). Mesmo
// mapeamento usado na tela de Alertas.
const ROTULOS_TIPO_ALERTA: Record<string, string> = {
  build_log_ausente: "Build Log ausente",
  auditoria_devida: "Auditoria devida",
  desvio_pilares: "Desvio de pilares",
  drift_critico: "Drift crítico",
};

const ROTULOS_STATUS_ITEM: Record<string, string> = {
  agendado: "Agendado",
  concluido: "Concluído",
  perdido: "Perdido",
};

export default async function DashboardPage() {
  const depsAgenda = criarDependenciasDaAgenda();
  const depsInbox = criarDependenciasDaInbox();
  const depsConteudo = criarDependenciasDeConteudo();
  const depsNotificacoes = criarDependenciasDeNotificacoes();
  const depsPipeline = criarDependenciasDoPipelineComercial();
  const depsClientes = criarDependenciasDeClientes();
  const depsProjetos = criarDependenciasDeProjetos();

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

  const leads = await listarLeads({}, { leadRepository: depsPipeline.leadRepository });
  const leadsAtivos = leads.filter(
    (l) => l.statusComercial !== "convertido_cliente" && l.statusComercial !== "perdido"
  );

  const clientes = await listarClientes({}, { clienteRepository: depsClientes.clienteRepository });

  const projetos = await listarProjetos({}, { projetoRepository: depsProjetos.projetoRepository });
  const projetosAtivos = projetos.filter((p) => p.status !== "encerrado");

  const pecas = await listarPecasDeConteudo(
    {},
    { pecaDeConteudoRepository: depsConteudo.pecaDeConteudoRepository }
  );
  const conteudosEmProducao = pecas.filter((p) => p.status !== "publicado");
  const conteudosPublicados = pecas.filter((p) => p.status === "publicado");

  return (
    <div>
      <PageHeader title="MeuCMO" description="Seu Diretor de Marketing movido por IA." />

      <div className="space-y-4">
        <Section title="Visão Geral">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Leads ativos" value={leadsAtivos.length} />
            <StatCard label="Clientes" value={clientes.length} />
            <StatCard label="Projetos ativos" value={projetosAtivos.length} />
            <StatCard label="Conteúdos em produção" value={conteudosEmProducao.length} />
            <StatCard label="Conteúdos publicados" value={conteudosPublicados.length} />
            <StatCard label="Alertas ativos" value={alertasAtivos.length} />
          </div>
        </Section>

        <Section title="Agenda do dia">
          {itensDoDia.length === 0 ? (
            <EmptyState message="Nenhum item de agenda hoje." />
          ) : (
            <ul className="space-y-2 text-sm text-zinc-700">
              {itensDoDia.map((item) => (
                <li key={item.id} className="border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
                  {item.dataHora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} ·{" "}
                  {descreverItemDeAgenda(item)} · {ROTULOS_STATUS_ITEM[item.status] ?? item.status}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title={`Alertas ativos (${alertasAtivos.length})`}
          action={
            <Link href="/alertas" className="text-sm text-zinc-500 hover:text-zinc-900">
              Ver todos
            </Link>
          }
        >
          {alertasAtivos.length === 0 ? (
            <EmptyState message="Nenhum alerta ativo — tudo em dia." />
          ) : (
            <ul className="space-y-2 text-sm text-zinc-700">
              {alertasAtivos.map((a) => (
                <li key={a.id} className="border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
                  <Badge variant="danger">{ROTULOS_TIPO_ALERTA[a.tipo] ?? a.tipo}</Badge>{" "}
                  <span className="ml-1">{a.condicaoGatilho}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Pendências da Inbox">
          {pendenciasInbox.length === 0 ? (
            <EmptyState message="Nenhuma pendência — Inbox em dia." />
          ) : (
            <p className="text-sm text-zinc-700">
              {pendenciasInbox.length} registro(s) aguardando revisão de sugestão de IA.{" "}
              <Link href="/inbox" className="text-zinc-900 underline">
                Revisar agora
              </Link>
            </p>
          )}
        </Section>

        <Section title="Distribuição de pilares">
          {desviosRelevantes.length === 0 ? (
            <EmptyState message="Distribuição de conteúdo alinhada à meta." />
          ) : (
            <ul className="space-y-2 text-sm text-zinc-700">
              {desviosRelevantes.map((d) => (
                <li key={d.pilarId} className="border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
                  {d.nome}: desvio de {d.desvio > 0 ? "+" : ""}
                  {d.desvio}% em relação à meta
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
