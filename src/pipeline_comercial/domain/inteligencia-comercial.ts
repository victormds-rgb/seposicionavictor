import type { Lead } from "./lead";
import { estaAtivo } from "./lead";

/**
 * Sprint 42 (Fundação Comercial) — inteligência sobre o Lead que já
 * existe, sem IA (SugestaoIA comercial fica para a próxima sprint —
 * ver docs/relatório da Sprint 41, item D). Tudo aqui é função pura:
 * mesma entrada, mesma saída, sem I/O — mesmo padrão já usado em
 * `src/app/(shell)/dashboard/memoria-executiva.ts` (Sprint 39).
 * `agora` é sempre recebido de fora (nunca `new Date()` aqui dentro)
 * para o cálculo continuar 100% testável e reproduzível.
 */

// ── Score comercial determinístico ──────────────────────────────────
//
// FÓRMULA (documentada, para poder ser ajustada sem virar arqueologia
// de código): soma de pontos por sinal positivo já disponível no
// domínio, menos uma penalidade por tempo sem contato. Resultado
// sempre entre 0 e 100.
//
// Decisões de peso (nenhum peso "chutado" sem razão):
// - `temperatura` e `estágio` são os dois sinais mais fortes que já
//   existem hoje (um é a leitura humana direta do SDR, o outro é
//   avanço real e verificável no funil) — por isso concentram a maior
//   parte da pontuação (30 e 35 no topo). `estágio` pesa um pouco mais
//   que `temperatura` porque avançar de estágio é um fato observável
//   (aconteceu ou não), enquanto temperatura é uma opinião.
// - `reunião realizada` NÃO vira uma dimensão própria: já está contida
//   em `estágio === "reunido"` (o estágio mais alto) — somar os dois
//   seria contar o mesmo sinal duas vezes.
// - `qualificação registrada`, `ticket estimado definido` e `próximo
//   contato definido` são sinais binários de "existe informação real
//   sobre este lead" — pesam menos que temperatura/estágio porque
//   indicam preparo, não avanço em si.
// - Sem dado nenhum sobre temperatura, o lead não ganha nem perde
//   pontos por isso (tratado como "frio" — sem sinal positivo, não é
//   penalidade).
const PONTOS_TEMPERATURA: Record<NonNullable<Lead["temperatura"]>, number> = {
  frio: 0,
  morno: 15,
  quente: 30,
};

const PONTOS_ESTAGIO: Record<Lead["statusComercial"], number> = {
  novo: 0,
  qualificando: 5,
  qualificado: 15,
  agendado: 25,
  reunido: 35,
  // Resolvidos não pontuam — `calcularScoreComercial` retorna `null`
  // antes de chegar aqui, estes dois só existem para o Record ser total.
  convertido_cliente: 0,
  perdido: 0,
};

const PONTOS_QUALIFICACAO_REGISTRADA = 15;
const PONTOS_TICKET_ESTIMADO_DEFINIDO = 10;
const PONTOS_PROXIMO_CONTATO_DEFINIDO = 10;

// Penalidade por tempo sem contato (desde `ultimoContatoEm`, ou desde
// `criadoEm` se o lead nunca foi contatado — ver `diasSemContato`).
// Faixas escolhidas para coincidir com o limiar de "lead parado" (48h
// = 2 dias, ver LIMITE_HORAS_LEAD_PARADO): até 2 dias não há
// penalidade (ainda dentro do prazo aceitável); a partir daí a
// penalidade cresce, igual ao padrão de limiar em faixa já usado em
// `notificacoes/application/monitor-de-consistencia.ts`
// (DIAS_LIMITE_BUILD_LOG_AUSENTE etc.).
const FAIXAS_PENALIDADE_TEMPO_SEM_CONTATO = [
  { ateDias: 2, penalidade: 0 },
  { ateDias: 7, penalidade: 10 },
  { ateDias: 14, penalidade: 25 },
  { ateDias: Infinity, penalidade: 40 },
] as const;

const SCORE_MAXIMO = 100;
const SCORE_MINIMO = 0;

export interface ContextoInteligenciaComercial {
  agora: Date;
  /** `true` se existe ao menos uma QualificacaoLead registrada para este Lead. */
  temQualificacaoRegistrada: boolean;
}

/**
 * Dias desde o último contato real — ou desde a criação do Lead, se
 * ele nunca foi contatado. Nunca usa `updatedAt` (não é um sinal de
 * contato, é técnico).
 */
export function diasSemContato(lead: Pick<Lead, "ultimoContatoEm" | "criadoEm">, agora: Date): number {
  const referencia = lead.ultimoContatoEm ?? lead.criadoEm;
  const diffMs = agora.getTime() - referencia.getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60 * 24));
}

function calcularPenalidadeTempoSemContato(dias: number): number {
  const faixa = FAIXAS_PENALIDADE_TEMPO_SEM_CONTATO.find((f) => dias <= f.ateDias);
  return faixa?.penalidade ?? 0;
}

/**
 * Score comercial (0–100) — só definido para Leads ainda ativos no
 * funil; `null` para `convertido_cliente`/`perdido` (resolvidos, o
 * score deixou de ter função — não faz sentido priorizar atenção a um
 * negócio que já terminou).
 */
export function calcularScoreComercial(
  lead: Lead,
  contexto: ContextoInteligenciaComercial
): number | null {
  if (!estaAtivo(lead)) return null;

  let pontos = 0;
  pontos += PONTOS_TEMPERATURA[lead.temperatura ?? "frio"];
  pontos += PONTOS_ESTAGIO[lead.statusComercial];
  if (contexto.temQualificacaoRegistrada) pontos += PONTOS_QUALIFICACAO_REGISTRADA;
  if (lead.ticketEstimado !== null) pontos += PONTOS_TICKET_ESTIMADO_DEFINIDO;
  if (lead.proximoContatoEm !== null) pontos += PONTOS_PROXIMO_CONTATO_DEFINIDO;

  pontos -= calcularPenalidadeTempoSemContato(diasSemContato(lead, contexto.agora));

  return Math.min(SCORE_MAXIMO, Math.max(SCORE_MINIMO, Math.round(pontos)));
}

// ── Lead parado ──────────────────────────────────────────────────────
//
// Definição (Sprint 42, respondendo à Sprint 41 item B/E — 48h é o
// mesmo número já usado como exemplo no desenho do Dashboard):
// - Limiar: mais de 48h desde o último contato real (ou desde a
//   criação, se nunca contatado).
// - Excluídos: `convertido_cliente`/`perdido` (resolvidos — não fazem
//   mais parte do funil ativo) e `agendado` (já tem um próximo passo
//   certo e datado — a própria reunião marcada É o próximo contato;
//   alertar aqui seria ruído, não sinal).
export const LIMITE_HORAS_LEAD_PARADO = 48;

const STATUS_EXCLUIDOS_DE_PARADO: readonly Lead["statusComercial"][] = [
  "convertido_cliente",
  "perdido",
  "agendado",
];

export function leadEstaParado(lead: Lead, agora: Date): boolean {
  if (STATUS_EXCLUIDOS_DE_PARADO.includes(lead.statusComercial)) return false;
  const horasSemContato = diasSemContato(lead, agora) * 24;
  return horasSemContato > LIMITE_HORAS_LEAD_PARADO;
}

// ── "Quem merece atenção agora" — agregador para Pipeline/Dashboard ──

export interface OportunidadesComerciais {
  leadsQuentes: Lead[];
  leadsParados: Lead[];
  followUpsHoje: Lead[];
}

function fimDoDia(data: Date): Date {
  const fim = new Date(data);
  fim.setHours(23, 59, 59, 999);
  return fim;
}

/**
 * Agrupa os Leads ativos nas três lentes que o Dashboard e o Pipeline
 * usam para responder "quem merece atenção agora" (Sprint 41, seção
 * E). "Quente" reaproveita `temperatura` diretamente — não introduz
 * um segundo conceito de "quente" concorrente com o que já existe.
 * "Follow-up hoje" inclui tanto os que vencem hoje quanto os já
 * atrasados (`proximoContatoEm` no passado) — esconder um follow-up
 * vencido do usuário seria pior do que mostrá-lo a mais.
 */
export function calcularOportunidadesComerciais(leads: Lead[], agora: Date): OportunidadesComerciais {
  const ativos = leads.filter(estaAtivo);
  const limiteFollowUp = fimDoDia(agora);

  return {
    leadsQuentes: ativos.filter((l) => l.temperatura === "quente"),
    leadsParados: ativos.filter((l) => leadEstaParado(l, agora)),
    followUpsHoje: ativos.filter((l) => l.proximoContatoEm !== null && l.proximoContatoEm <= limiteFollowUp),
  };
}
