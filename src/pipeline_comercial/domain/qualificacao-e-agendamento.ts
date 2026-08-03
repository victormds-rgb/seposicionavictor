export interface QualificacaoLead {
  id: string;
  leadId: string;
  resumoQualificacao: string | null;
  doresIdentificadas: string[] | null;
  objecoes: string | null;
  proximoPasso: string | null;
  documentosEnviados: string[] | null;
  linksRelevantes: string[] | null;
}

export const STATUS_AGENDAMENTO_COMERCIAL = [
  "agendado",
  "confirmado",
  "realizado",
  "no_show",
  "cancelado",
] as const;
export type StatusAgendamentoComercial = (typeof STATUS_AGENDAMENTO_COMERCIAL)[number];

export interface AgendamentoComercial {
  id: string;
  leadId: string;
  googleCalendarEventId: string | null;
  dataHora: Date;
  status: StatusAgendamentoComercial;
  reuniaoId: string | null;
}
