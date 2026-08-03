/**
 * Domínio do ItemDeAgenda (Bounded Context Agenda) — DOMAIN_MODEL.md,
 * SOM Cap. 9.4 (rotina semanal fixa).
 */

export const TIPOS_ITEM_AGENDA = ["reuniao", "rotina_fixa", "tarefa_com_prazo"] as const;
export type TipoItemAgenda = (typeof TIPOS_ITEM_AGENDA)[number];

export const STATUS_ITEM_AGENDA = ["agendado", "concluido", "perdido"] as const;
export type StatusItemAgenda = (typeof STATUS_ITEM_AGENDA)[number];

export interface ItemDeAgenda {
  id: string;
  tipo: TipoItemAgenda;
  dataHora: Date;
  reuniaoId: string | null;
  tarefaId: string | null;
  rotinaFixaReferencia: string | null;
  recorrente: boolean;
  status: StatusItemAgenda;
}

/**
 * Rotina semanal fixa (SOM, Cap. 9.4) — as 5 atividades recorrentes de
 * segunda a sexta. A referência (`rotinaFixaReferencia`) rastreia
 * exatamente qual atividade do capítulo do SOM aquele item representa
 * (invariante do DOMAIN_MODEL.md, entidade ItemDeAgenda).
 */
export const ROTINA_SEMANAL_FIXA = [
  { diaSemana: 1, referencia: "segunda_desculpa_semana", descricao: "Revisar semana anterior e escolher caso/tendência para \"A Desculpa da Semana\"" },
  { diaSemana: 2, referencia: "terca_build_log", descricao: "Gravar/escrever Build Log do produto" },
  { diaSemana: 3, referencia: "quarta_analise_critica", descricao: "Produzir análise crítica (Framework 1)" },
  { diaSemana: 4, referencia: "quinta_bastidor", descricao: "Bastidor/erro da semana (Quebra-Recuo-Volta)" },
  { diaSemana: 5, referencia: "sexta_revisao", descricao: "Revisão + agendamento da semana seguinte + resposta a comentários" },
] as const;

export function podeSerConcluido(item: Pick<ItemDeAgenda, "status">): boolean {
  return item.status === "agendado";
}

/** Invariante: um item só pode ser marcado como perdido se ainda estava agendado e já passou do horário. */
export function podeSerMarcadoComoPerdido(
  item: Pick<ItemDeAgenda, "status" | "dataHora">,
  agora: Date
): boolean {
  return item.status === "agendado" && item.dataHora.getTime() < agora.getTime();
}

/** Invariante (DOMAIN_MODEL.md): item do tipo `rotina_fixa` sempre referencia qual dia/atividade representa. */
export function ehItemDeRotinaFixaValido(item: Pick<ItemDeAgenda, "tipo" | "rotinaFixaReferencia">): boolean {
  if (item.tipo !== "rotina_fixa") return true;
  return (
    item.rotinaFixaReferencia !== null &&
    ROTINA_SEMANAL_FIXA.some((r) => r.referencia === item.rotinaFixaReferencia)
  );
}
