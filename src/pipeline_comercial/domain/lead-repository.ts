import type { Lead, StatusComercial } from "./lead";
import type {
  QualificacaoLead,
  AgendamentoComercial,
  StatusAgendamentoComercial,
} from "./qualificacao-e-agendamento";

export interface FiltrosLead {
  statusComercial?: StatusComercial;
}

export interface LeadRepository {
  criar(lead: Omit<Lead, "id">): Promise<Lead>;
  buscarPorId(id: string): Promise<Lead | null>;
  atualizarStatusComercial(id: string, status: StatusComercial): Promise<void>;
  listar(filtros: FiltrosLead): Promise<Lead[]>;

  criarQualificacao(qualificacao: Omit<QualificacaoLead, "id">): Promise<QualificacaoLead>;
  buscarQualificacaoMaisRecente(leadId: string): Promise<QualificacaoLead | null>;

  criarAgendamento(
    agendamento: Omit<AgendamentoComercial, "id">
  ): Promise<AgendamentoComercial>;
  atualizarStatusAgendamento(id: string, status: StatusAgendamentoComercial): Promise<void>;
  buscarAgendamentoMaisRecente(leadId: string): Promise<AgendamentoComercial | null>;
}
