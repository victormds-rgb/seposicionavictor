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
import { createSupabaseServerClient } from "@infra/auth/supabase-server";
import { calcularMudancasDesdeUltimaVisita, interpretarUltimaVisita } from "./memoria-executiva";
import { RegistrarVisita } from "./_components/registrar-visita";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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

// Sprint 34 (Briefing do Dia): link de ação de cada cartão — mesma
// linguagem visual do variant "secondary" de Button
// (src/components/ui/button.tsx), só que como <a> (navegação de
// página, não submissão de formulário — Button não tem `href`).
const CLASSE_BOTAO_CARTAO =
  "mt-3 inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2";

interface Recomendacao {
  icone: string;
  titulo: string;
  descricao: string;
  href: string;
  rotuloAcao: string;
}

interface RecomendacaoEstrategica {
  icone: string;
  texto: string;
  justificativa?: string;
  href: string;
  rotuloAcao: string;
}

// Sprint 35 (Briefing Inteligente): não recalcula nada — só decide
// que frase mostrar para uma condição que os dados acima já provam
// verdadeira. Nenhuma frase aparece se a condição correspondente for
// falsa (nunca "frase falsa"). Copy evita termos técnicos (Sprint 35,
// seção "Copy": nada de "fora da meta", "pendência", "registro").

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

  // Sprint 34 — Briefing do Dia: reaproveita exclusivamente os dados
  // já carregados acima para as demais seções (nenhuma query nova,
  // nenhum cálculo novo) — só reorganiza em recomendações acionáveis.
  const projetosProntosParaCase = projetos.filter((p) => p.status === "pronto_para_case");

  // Ordem de prioridade fixada pela Sprint 35: Alertas → Inbox →
  // Agenda → Projetos prontos para Case → Conteúdo. Mesma ordem para
  // as frases do resumo e para os cartões, evitando o resumo apontar
  // uma prioridade e os cartões abaixo mostrarem outra.
  const recomendacoes: Recomendacao[] = [];
  const frasesResumo: string[] = [];

  if (alertasAtivos.length > 0) {
    const [primeiro] = alertasAtivos;
    frasesResumo.push("Há alertas importantes que precisam da sua atenção.");
    recomendacoes.push({
      icone: "🔴",
      titulo: "Prioridade",
      descricao:
        alertasAtivos.length > 1
          ? `${primeiro!.condicaoGatilho} (+ ${alertasAtivos.length - 1} outro(s) alerta ativo)`
          : primeiro!.condicaoGatilho,
      href: "/alertas",
      rotuloAcao: "Ir para Alertas",
    });
  }

  if (pendenciasInbox.length > 0) {
    frasesResumo.push(
      `Existem ${pendenciasInbox.length} item(ns) aguardando sua decisão na Inbox.`
    );
    recomendacoes.push({
      icone: "📥",
      titulo: "Caixa de Entrada",
      descricao: `Existem ${pendenciasInbox.length} item(ns) aguardando sua decisão.`,
      href: "/inbox",
      rotuloAcao: "Abrir Inbox",
    });
  }

  if (itensDoDia.length > 0) {
    frasesResumo.push(`Você tem ${itensDoDia.length} atividade(s) na agenda hoje.`);
    recomendacoes.push({
      icone: "📅",
      titulo: "Hoje",
      descricao: `Você possui ${itensDoDia.length} atividade(s).`,
      href: "/agenda",
      rotuloAcao: "Abrir Agenda",
    });
  }

  if (projetosProntosParaCase.length > 0) {
    frasesResumo.push("Um projeto já pode ser transformado em Case.");
    recomendacoes.push({
      icone: "⭐",
      titulo: "Oportunidade",
      descricao: "Existe um projeto pronto para virar Case.",
      href: "/projetos",
      rotuloAcao: "Abrir Projetos",
    });
  }

  if (desviosRelevantes.length > 0) {
    frasesResumo.push("Sua produção de conteúdo precisa de atenção para se alinhar à meta.");
    recomendacoes.push({
      icone: "📊",
      titulo: "Conteúdo",
      descricao: "Sua produção de conteúdo precisa de atenção para se alinhar à meta.",
      href: "/conteudo",
      rotuloAcao: "Abrir Conteúdo",
    });
  }

  // Sprint 36 (Recomendações Estratégicas): mesmas condições já
  // provadas acima (nenhuma query/cálculo novo) — só aconselha em vez
  // de informar. Texto deliberadamente diferente do Resumo Executivo
  // (Sprint 35) para nunca repetir a mesma frase; máximo 3 cartões,
  // mesma ordem de prioridade Alertas → Inbox → Agenda → Projetos →
  // Conteúdo.
  const recomendacoesEstrategicas: RecomendacaoEstrategica[] = [];

  if (alertasAtivos.length > 0) {
    recomendacoesEstrategicas.push({
      icone: "🚨",
      texto: "Eu resolveria os alertas antes de produzir novos conteúdos.",
      href: "/alertas",
      rotuloAcao: "Abrir Alertas",
    });
  }

  if (pendenciasInbox.length > 0) {
    recomendacoesEstrategicas.push({
      icone: "📥",
      texto: "Eu começaria classificando os registros da Inbox.",
      justificativa: "Eles podem gerar novos conteúdos, tarefas ou oportunidades.",
      href: "/inbox",
      rotuloAcao: "Abrir Inbox",
    });
  }

  if (itensDoDia.length > 0) {
    recomendacoesEstrategicas.push({
      icone: "📅",
      texto: "Eu começaria pelas atividades programadas para hoje.",
      href: "/agenda",
      rotuloAcao: "Abrir Agenda",
    });
  }

  if (projetosProntosParaCase.length > 0) {
    recomendacoesEstrategicas.push({
      icone: "⭐",
      texto: "Eu transformaria este projeto em um Case ainda hoje.",
      justificativa: "Cases geram autoridade e alimentam sua estratégia de conteúdo.",
      href: "/projetos",
      rotuloAcao: "Abrir Projeto",
    });
  }

  if (desviosRelevantes.length > 0) {
    recomendacoesEstrategicas.push({
      icone: "📊",
      texto: "Eu equilibraria a produção de conteúdo antes da próxima publicação.",
      href: "/conteudo",
      rotuloAcao: "Abrir Conteúdo",
    });
  }

  const topRecomendacoesEstrategicas = recomendacoesEstrategicas.slice(0, 3);

  // Sprint 37 (Pergunta Estratégica): mesma ordem de prioridade
  // (Alertas → Inbox → Agenda → Projetos → Conteúdo), mas só a
  // primeira condição verdadeira vence — nunca mais de uma pergunta.
  // Sem condição nenhuma, cai no fallback fixo (não é uma consulta,
  // é o texto padrão da sprint).
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

  // Sprint 39 (Memória Executiva REAL) — substitui a versão da
  // Sprint 38, que reapresentava o estado atual como se fosse
  // novidade. Agora compara de verdade contra `ultimaVisitaEm`
  // (guardada em user_metadata do Supabase Auth — ver
  // src/app/(shell)/dashboard/actions.ts). A LEITURA acontece aqui,
  // ANTES de qualquer atualização — o timestamp só é avançado depois
  // que a página já renderizou de verdade no navegador
  // (<RegistrarVisita /> abaixo, via useEffect), nunca durante este
  // render.
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

  return (
    <div>
      <RegistrarVisita />
      <PageHeader title="MeuCMO" description="Seu Diretor de Marketing movido por IA." />

      <div className="space-y-4">
        <Section title="Pergunta Estratégica do Dia">
          <Card className="p-4 shadow-none">
            <p className="text-sm font-medium text-zinc-900">🤔 {perguntaEstrategica}</p>
          </Card>
        </Section>

        <Section title="Desde sua última visita">
          {primeiraVisita ? (
            <EmptyState message="Esta é sua primeira visita — a partir de agora o MeuCMO acompanha o que muda." />
          ) : mudancasReais.length === 0 ? (
            <EmptyState message="Nenhuma mudança relevante desde sua última visita." />
          ) : (
            <Card className="p-4 shadow-none">
              <ul className="space-y-1 text-sm text-zinc-700">
                {mudancasReais.map((mudanca) => (
                  <li key={mudanca}>✓ {mudanca}</li>
                ))}
              </ul>
            </Card>
          )}
        </Section>

        <Section title="Resumo Executivo">
          <p className="text-sm text-zinc-500">Seu MeuCMO preparou uma visão rápida da operação.</p>

          {recomendacoes.length === 0 ? (
            <div className="mt-3">
              <EmptyState message="Bom dia. Sua operação está saudável. Nenhuma prioridade foi encontrada hoje." />
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm text-zinc-700">
                Bom dia. Hoje encontrei {recomendacoes.length} ponto(s) importante(s) na sua
                operação.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {frasesResumo.map((frase) => (
                  <li key={frase}>• {frase}</li>
                ))}
              </ul>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {recomendacoes.map((r) => (
                  <Card key={r.titulo} className="p-4 shadow-none">
                    <p className="text-sm font-semibold text-zinc-900">
                      {r.icone} {r.titulo}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">{r.descricao}</p>
                    <Link href={r.href} className={CLASSE_BOTAO_CARTAO}>
                      {r.rotuloAcao}
                    </Link>
                  </Card>
                ))}
              </div>
            </>
          )}
        </Section>

        <Section title="Recomendações do MeuCMO">
          {topRecomendacoesEstrategicas.length === 0 ? (
            <EmptyState message="Nenhuma recomendação estratégica no momento." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {topRecomendacoesEstrategicas.map((r) => (
                <Card key={r.texto} className="p-4 shadow-none">
                  <p className="text-sm font-medium text-zinc-900">
                    {r.icone} {r.texto}
                  </p>
                  {r.justificativa && <p className="mt-1 text-sm text-zinc-500">{r.justificativa}</p>}
                  <Link href={r.href} className={CLASSE_BOTAO_CARTAO}>
                    {r.rotuloAcao}
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </Section>

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
