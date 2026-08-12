import Link from "next/link";
import { Bell, Sparkles, ArrowRight, Inbox as InboxIcon, Calendar, FolderKanban, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { listarItensAgenda } from "@/agenda/application/listar-itens-agenda";
import { criarDependenciasDaAgenda } from "@/agenda/infrastructure/composicao";
import { listarRegistrosBrutos } from "@/inbox/application/listar-registros-brutos";
import { criarDependenciasDaInbox } from "@/inbox/infrastructure/composicao";
import { calcularDistribuicaoDePilares } from "@/conteudo/application/calcular-distribuicao-de-pilares";
import { criarDependenciasDeConteudo } from "@/conteudo/infrastructure/composicao";
import { listarAlertas } from "@/notificacoes/application/gestao-de-alertas";
import { criarDependenciasDeNotificacoes } from "@/notificacoes/infrastructure/composicao";
import { listarLeads } from "@/pipeline_comercial/application/listar-leads";
import { criarDependenciasDoPipelineComercial } from "@/pipeline_comercial/infrastructure/composicao";
import { calcularOportunidadesComerciais } from "@/pipeline_comercial/domain/inteligencia-comercial";
import { listarClientes } from "@/clientes/application/listar-clientes";
import { criarDependenciasDeClientes } from "@/clientes/infrastructure/composicao";
import { listarProjetos } from "@/projetos/application/listar-e-encerrar-projeto";
import { criarDependenciasDeProjetos } from "@/projetos/infrastructure/composicao";
import { listarPecasDeConteudo } from "@/conteudo/application/listar-pecas-de-conteudo";
import { createSupabaseServerClient } from "@infra/auth/supabase-server";
import { calcularMudancasDesdeUltimaVisita, interpretarUltimaVisita } from "./memoria-executiva";
import { RegistrarVisita } from "./_components/registrar-visita";
import { Section } from "@/components/ui/section";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

/**
 * Dashboard — Centro de Comando do FDE (Checkpoint G — Redesign do
 * Dashboard). Estrutura original da Sprint 1/9, evoluída em várias
 * sprints de inteligência (34-39) para um Dashboard "achatado" — três
 * seções diferentes (Resumo Executivo / Recomendações / mini-painéis)
 * repetindo as MESMAS 5 condições. O Checkpoint G consolida isso numa
 * narrativa única: Contexto → Visão Executiva → Atenção → Próximas
 * Ações → Estado da Operação → Atividade Recente → Recomendações.
 *
 * Nenhuma query nova: todo dado abaixo já era carregado antes desta
 * etapa — só mudou a curadoria/composição visual (auditoria completa
 * no checkpoint anterior).
 *
 * Apenas consulta dados — o MonitorDeConsistencia roda como Job do
 * Scheduler (`infra/scheduler/jobs/monitor-de-consistencia-job.ts`),
 * não durante a renderização (Hardening, ARCHITECTURE.md, seção 12).
 */
export const dynamic = "force-dynamic";

// Sprint 33.5 (Refinamento) + Checkpoint G: "lead_parado" (Sprint 42)
// estava ausente aqui — mesmo mapeamento de `alertas/page.tsx`.
const ROTULOS_TIPO_ALERTA: Record<string, string> = {
  build_log_ausente: "Build Log ausente",
  auditoria_devida: "Auditoria devida",
  desvio_pilares: "Desvio de pilares",
  drift_critico: "Drift crítico",
  lead_parado: "Lead parado",
};

function saudacaoPorHorario(hora: number): string {
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

interface AcaoProxima {
  icone: LucideIcon;
  texto: string;
  href: string;
  rotuloAcao: string;
}

interface RecomendacaoFde {
  texto: string;
  motivo: string;
  href: string;
  rotuloAcao: string;
}

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

  // Checkpoint G: a lista continua vindo inteira do repositório (sem
  // `limit` — FiltrosAlerta não suporta, adicionar isso seria backend
  // novo, fora do aprovado nesta etapa) — mas só os 3 alertas mais
  // antigos (proxy real de "mais urgente", já que o domínio Alerta
  // não tem campo de severidade) são renderizados no bloco Atenção. O
  // total real continua visível na frase e no badge do topbar.
  const alertasAtivos = await listarAlertas(
    { status: "ativo" },
    { alertaRepository: depsNotificacoes.alertaRepository }
  );
  const alertasParaAtencao = [...alertasAtivos]
    .sort((a, b) => a.dataDisparo.getTime() - b.dataDisparo.getTime())
    .slice(0, 3);

  const leads = await listarLeads({}, { leadRepository: depsPipeline.leadRepository });
  const leadsAtivos = leads.filter(
    (l) => l.statusComercial !== "convertido_cliente" && l.statusComercial !== "perdido"
  );
  const oportunidades = calcularOportunidadesComerciais(leads, hoje);

  const clientes = await listarClientes({}, { clienteRepository: depsClientes.clienteRepository });

  const projetos = await listarProjetos({}, { projetoRepository: depsProjetos.projetoRepository });
  const projetosAtivos = projetos.filter((p) => p.status !== "encerrado");
  const projetosProntosParaCase = projetos.filter((p) => p.status === "pronto_para_case");

  const pecas = await listarPecasDeConteudo(
    {},
    { pecaDeConteudoRepository: depsConteudo.pecaDeConteudoRepository }
  );
  const conteudosEmProducao = pecas.filter((p) => p.status !== "publicado");
  const conteudosPublicados = pecas.filter((p) => p.status === "publicado");

  // Pergunta Estratégica (Sprint 37): mesma ordem de prioridade de
  // sempre (Alertas → Inbox → Agenda → Projetos → Conteúdo), só a
  // primeira condição verdadeira vence.
  let perguntaEstrategica: string;
  if (alertasAtivos.length > 0) {
    perguntaEstrategica = "O que pode acontecer se este alerta continuar aberto por mais alguns dias?";
  } else if (pendenciasInbox.length > 0) {
    perguntaEstrategica = "O que pode estar escondido na sua Inbox hoje?";
  } else if (itensDoDia.length > 0) {
    perguntaEstrategica = "Qual atividade de hoje terá maior impacto no seu negócio?";
  } else if (projetosProntosParaCase.length > 0) {
    perguntaEstrategica = "Por que este projeto ainda não virou um Case?";
  } else if (desviosRelevantes.length > 0) {
    perguntaEstrategica =
      "Você está fortalecendo a autoridade da marca ou apenas produzindo mais conteúdo?";
  } else {
    perguntaEstrategica =
      "Se hoje fosse seu primeiro dia como Diretor de Marketing desta empresa, por onde você começaria?";
  }

  // Checkpoint G: Próximas Ações — uma ação por condição real, cada
  // uma com destino real. `leadsParados` (Sprint 42) reaproveitado
  // aqui pela primeira vez fora da seção comercial.
  const proximasAcoes: AcaoProxima[] = [];
  if (pendenciasInbox.length > 0) {
    proximasAcoes.push({
      icone: InboxIcon,
      texto: `${pendenciasInbox.length} item(ns) aguardando sua decisão na Inbox.`,
      href: "/inbox",
      rotuloAcao: "Abrir Inbox",
    });
  }
  if (itensDoDia.length > 0) {
    proximasAcoes.push({
      icone: Calendar,
      texto: `${itensDoDia.length} atividade(s) na agenda hoje.`,
      href: "/agenda",
      rotuloAcao: "Abrir Agenda",
    });
  }
  if (projetosProntosParaCase.length > 0) {
    proximasAcoes.push({
      icone: FolderKanban,
      texto: "Um projeto está pronto para virar Case.",
      href: "/projetos",
      rotuloAcao: "Abrir Projetos",
    });
  }
  if (oportunidades.leadsParados.length > 0) {
    proximasAcoes.push({
      icone: TrendingUp,
      texto: `${oportunidades.leadsParados.length} lead(s) sem contato há mais de 48h.`,
      href: "/pipeline?filtro=parados",
      rotuloAcao: "Abrir Pipeline",
    });
  }

  // Checkpoint G: Recomendações do FDE — camada interpretativa,
  // deliberadamente diferente de Atenção (Alerta) e Próximas Ações
  // (uma condição = uma ação): cada recomendação SINTETIZA 2 sinais
  // reais em vez de repetir um fato isolado que já aparece em outro
  // bloco — evita duplicar a mesma informação em lugares diferentes.
  const recomendacoesFde: RecomendacaoFde[] = [];
  if (projetosProntosParaCase.length > 0) {
    recomendacoesFde.push({
      texto: "Transforme este projeto em Case antes de criar conteúdo novo.",
      motivo: "Cases geram autoridade e alimentam sua estratégia de conteúdo.",
      href: "/projetos",
      rotuloAcao: "Ver projeto",
    });
  }
  if (desviosRelevantes.length > 0) {
    const maiorDesvio = [...desviosRelevantes].sort(
      (a, b) => Math.abs(b.desvio) - Math.abs(a.desvio)
    )[0]!;
    recomendacoesFde.push({
      texto: `Sua produção está desviada da meta em "${maiorDesvio.nome}" (${maiorDesvio.desvio > 0 ? "+" : ""}${maiorDesvio.desvio}%).`,
      motivo: "Vale equilibrar a distribuição antes da próxima publicação.",
      href: "/conteudo",
      rotuloAcao: "Abrir Conteúdo",
    });
  }
  if (oportunidades.leadsQuentes.length > 0 && oportunidades.leadsParados.length > 0) {
    recomendacoesFde.push({
      texto: `Você tem ${oportunidades.leadsQuentes.length} oportunidade(s) quente(s) e ${oportunidades.leadsParados.length} lead(s) parado(s) há 48h+.`,
      motivo: "Priorize contato com os leads parados antes que esfriem.",
      href: "/pipeline?filtro=parados",
      rotuloAcao: "Abrir Pipeline",
    });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ultimaVisitaEm = interpretarUltimaVisita(user?.user_metadata?.ultimaVisitaEm);
  const primeiraVisita = ultimaVisitaEm === null;

  const mudancasReais = calcularMudancasDesdeUltimaVisita({
    ultimaVisitaEm,
    alertas: alertasAtivos,
    registrosInbox: pendenciasInbox,
    projetosProntosParaCase,
  });

  const nomeCompleto = (user?.user_metadata?.nome as string | undefined) ?? null;
  const primeiroNome = nomeCompleto?.split(" ")[0] ?? user?.email?.split("@")[0] ?? null;
  const saudacao = saudacaoPorHorario(hoje.getHours());

  const temPendenciaSemAlerta =
    pendenciasInbox.length > 0 ||
    itensDoDia.length > 0 ||
    projetosProntosParaCase.length > 0 ||
    oportunidades.leadsParados.length > 0;
  const fraseContexto =
    alertasAtivos.length > 0
      ? "Existem alertas que merecem sua atenção hoje."
      : temPendenciaSemAlerta
        ? "Você tem algumas decisões esperando por você hoje."
        : "Sua operação está tranquila — nada urgente agora.";

  return (
    <div>
      <RegistrarVisita />

      {/* 1-2. Saudação real + contexto curto */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">
          {saudacao}
          {primeiroNome ? `, ${primeiroNome}` : ""}
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">{fraseContexto}</p>
      </div>

      {/* 3. Pergunta Estratégica — único bloco de alto contraste da
          página, integrado logo abaixo da saudação. */}
      <div className="mb-6 rounded-lg bg-ink-primary p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-white/50">Pergunta do dia</p>
        <p className="mt-2 text-base font-medium text-white">{perguntaEstrategica}</p>
      </div>

      {/* Ordem visual muda entre mobile e desktop via `order` —
          mobile prioriza Atenção/Próximas Ações antes das métricas
          (Regra de Responsividade do Checkpoint G), sem duplicar
          marcação. */}
      <div className="flex flex-col gap-6">
        {/* 4. Visão Executiva — poucos indicadores reais */}
        <div className="order-3 md:order-1">
          <Section title="Visão Executiva">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Pipeline ativo" value={leadsAtivos.length} />
              <StatCard label="Projetos ativos" value={projetosAtivos.length} />
              <StatCard label="Compromissos hoje" value={itensDoDia.length} />
              <StatCard label="Aguardando decisão" value={pendenciasInbox.length} />
            </div>
          </Section>
        </div>

        {/* 5. Atenção — curadoria do domínio Alerta; total real segue
            visível, dourado usado uma única vez (ícone do cabeçalho). */}
        <div className="order-1 md:order-2">
          <Section title="Atenção">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="size-4 shrink-0 text-accent" aria-hidden="true" />
              <p className="text-sm text-ink-secondary">
                {alertasAtivos.length === 0
                  ? "Nada pedindo sua atenção agora."
                  : alertasAtivos.length === 1
                    ? "1 coisa merece sua atenção."
                    : `${alertasAtivos.length} coisas merecem sua atenção.`}
              </p>
            </div>
            {alertasAtivos.length > 0 && (
              <>
                <ul className="space-y-2">
                  {alertasParaAtencao.map((a) => (
                    <li key={a.id} className="rounded-md border border-border-subtle p-3">
                      <Badge variant="danger">{ROTULOS_TIPO_ALERTA[a.tipo] ?? a.tipo}</Badge>
                      <p className="mt-1.5 text-sm text-ink-primary">{a.condicaoGatilho}</p>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/alertas"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
                >
                  Ver todos os alertas <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </>
            )}
          </Section>
        </div>

        {/* 6. Próximas Ações — uma linha por condição real, destino real */}
        <div className="order-2 md:order-3">
          <Section title="Próximas Ações">
            {proximasAcoes.length === 0 ? (
              <EmptyState message="Nenhuma ação pendente agora — tudo em dia." />
            ) : (
              <ul className="divide-y divide-border-subtle">
                {proximasAcoes.map((acao) => (
                  <li
                    key={acao.texto}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <acao.icone className="size-4 shrink-0 text-ink-tertiary" aria-hidden="true" />
                      <p className="text-sm text-ink-primary">{acao.texto}</p>
                    </div>
                    <Link
                      href={acao.href}
                      className="shrink-0 text-sm font-medium text-primary hover:text-primary-hover"
                    >
                      {acao.rotuloAcao} →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* 7. Estado da Operação — "como está minha operação", sem
            virar mais um grid de números: agrupado por área, números
            reais lado a lado (real vs. meta), sem tendência inventada. */}
        <div className="order-4 md:order-4">
          <Section title="Estado da Operação">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
                  Comercial
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-ink-secondary">
                  <li>{clientes.length} cliente(s).</li>
                  {oportunidades.leadsQuentes.length > 0 && (
                    <li>{oportunidades.leadsQuentes.length} oportunidade(s) quente(s).</li>
                  )}
                  {oportunidades.followUpsHoje.length > 0 && (
                    <li>{oportunidades.followUpsHoje.length} follow-up(s) vence(m) hoje.</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
                  Conteúdo
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-ink-secondary">
                  <li>{conteudosEmProducao.length} peça(s) em produção.</li>
                  <li>{conteudosPublicados.length} peça(s) publicada(s).</li>
                </ul>
                {distribuicao.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-border-subtle pt-3 text-xs text-ink-tertiary">
                    {distribuicao.map((d) => (
                      <li key={d.pilarId} className="flex items-center justify-between gap-2">
                        <span className="truncate">{d.nome}</span>
                        <span className="shrink-0">
                          {d.pesoRealPercentual}% <span className="text-ink-tertiary/70">(meta {d.pesoAlvoPercentual}%)</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Section>
        </div>

        {/* 8. Atividade Recente — "Desde sua última visita", mantido */}
        <div className="order-5 md:order-5">
          <Section title="Atividade Recente">
            {primeiraVisita ? (
              <div className="rounded-md border border-border-subtle bg-surface-sunken p-4">
                <p className="text-sm font-medium text-ink-primary">Esta é sua primeira visita ao FDE.</p>
                <p className="mt-1 text-sm text-ink-secondary">
                  A partir de agora, o FDE acompanha Alertas, Pipeline, Projetos, Conteúdo e Agenda
                  — e te avisa aqui sempre que algo mudar ou precisar da sua atenção.
                </p>
              </div>
            ) : mudancasReais.length === 0 ? (
              <EmptyState message="Nenhuma mudança relevante desde sua última visita." />
            ) : (
              <ul className="space-y-1 text-sm text-ink-secondary">
                {mudancasReais.map((mudanca) => (
                  <li key={mudanca}>✓ {mudanca}</li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* 9. Recomendações do FDE — interpretação, não repetição:
            cada item cruza 2 sinais reais (ver comentário acima, onde
            a lista é montada). */}
        <div className="order-6 md:order-6">
          <Section title="Recomendações do FDE">
            {recomendacoesFde.length === 0 ? (
              <EmptyState message="Nenhuma recomendação estratégica no momento." />
            ) : (
              <ul className="space-y-3">
                {recomendacoesFde.map((r) => (
                  <li key={r.texto} className="rounded-md border border-primary/20 bg-primary-tint p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink-primary">{r.texto}</p>
                        <p className="mt-1 text-sm text-ink-secondary">{r.motivo}</p>
                        <Link
                          href={r.href}
                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
                        >
                          {r.rotuloAcao} <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
