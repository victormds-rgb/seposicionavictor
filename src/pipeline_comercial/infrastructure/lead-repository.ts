import { and, desc, eq } from "drizzle-orm";
import { db } from "@infra/persistence/db/client";
import { lead, qualificacaoLead, agendamentoComercial } from "@infra/persistence/db/schema";
import type { LeadRepository, FiltrosLead } from "@/pipeline_comercial/domain/lead-repository";
import type { Lead, StatusComercial } from "@/pipeline_comercial/domain/lead";
import type {
  QualificacaoLead,
  AgendamentoComercial,
  StatusAgendamentoComercial,
} from "@/pipeline_comercial/domain/qualificacao-e-agendamento";

type LeadRow = typeof lead.$inferSelect;
type QualificacaoRow = typeof qualificacaoLead.$inferSelect;
type AgendamentoRow = typeof agendamentoComercial.$inferSelect;

function leadParaDominio(row: LeadRow): Lead {
  return {
    id: row.id,
    nome: row.nome,
    origemLead: row.origemLead,
    sdrResponsavel: row.sdrResponsavel,
    temperatura: row.temperatura as Lead["temperatura"],
    ticketEstimado: row.ticketEstimado ? Number(row.ticketEstimado) : null,
    statusComercial: row.statusComercial as StatusComercial,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    canalOrigem: row.canalOrigem as Lead["canalOrigem"],
    campanha: row.campanha,
    interesse: row.interesse,
    ultimoContatoEm: row.ultimoContatoEm,
    proximoContatoEm: row.proximoContatoEm,
    motivoPerda: row.motivoPerda,
    criadoEm: row.createdAt,
  };
}

function qualificacaoParaDominio(row: QualificacaoRow): QualificacaoLead {
  return {
    id: row.id,
    leadId: row.leadId,
    resumoQualificacao: row.resumoQualificacao,
    doresIdentificadas: (row.doresIdentificadas as string[] | null) ?? null,
    objecoes: row.objecoes,
    proximoPasso: row.proximoPasso,
    documentosEnviados: (row.documentosEnviados as string[] | null) ?? null,
    linksRelevantes: (row.linksRelevantes as string[] | null) ?? null,
  };
}

function agendamentoParaDominio(row: AgendamentoRow): AgendamentoComercial {
  return {
    id: row.id,
    leadId: row.leadId,
    googleCalendarEventId: row.googleCalendarEventId,
    dataHora: row.dataHora,
    status: row.status as StatusAgendamentoComercial,
    reuniaoId: row.reuniaoId,
  };
}

export class DrizzleLeadRepository implements LeadRepository {
  async criar(input: Omit<Lead, "id" | "criadoEm">): Promise<Lead> {
    const [row] = await db
      .insert(lead)
      .values({
        nome: input.nome,
        origemLead: input.origemLead,
        sdrResponsavel: input.sdrResponsavel,
        temperatura: input.temperatura,
        ticketEstimado: input.ticketEstimado?.toString(),
        statusComercial: input.statusComercial,
        metadata: input.metadata,
        canalOrigem: input.canalOrigem,
        campanha: input.campanha,
        interesse: input.interesse,
        ultimoContatoEm: input.ultimoContatoEm,
        proximoContatoEm: input.proximoContatoEm,
        motivoPerda: input.motivoPerda,
      })
      .returning();

    if (!row) throw new Error("Falha ao criar Lead: nenhuma linha retornada.");
    return leadParaDominio(row);
  }

  async buscarPorId(id: string): Promise<Lead | null> {
    const [row] = await db.select().from(lead).where(eq(lead.id, id)).limit(1);
    return row ? leadParaDominio(row) : null;
  }

  async atualizarStatusComercial(id: string, status: StatusComercial): Promise<void> {
    await db.update(lead).set({ statusComercial: status, updatedAt: new Date() }).where(eq(lead.id, id));
  }

  async registrarContato(id: string, contatoEm: Date): Promise<void> {
    await db.update(lead).set({ ultimoContatoEm: contatoEm, updatedAt: new Date() }).where(eq(lead.id, id));
  }

  async definirProximoContato(id: string, proximoContatoEm: Date): Promise<void> {
    await db.update(lead).set({ proximoContatoEm, updatedAt: new Date() }).where(eq(lead.id, id));
  }

  async marcarComoPerdido(id: string, motivoPerda: string): Promise<void> {
    await db
      .update(lead)
      .set({ statusComercial: "perdido", motivoPerda, updatedAt: new Date() })
      .where(eq(lead.id, id));
  }

  async listar(filtros: FiltrosLead): Promise<Lead[]> {
    const condicoes = [];
    if (filtros.statusComercial) condicoes.push(eq(lead.statusComercial, filtros.statusComercial));

    const rows = await db
      .select()
      .from(lead)
      .where(condicoes.length > 0 ? and(...condicoes) : undefined);

    return rows.map(leadParaDominio);
  }

  async criarQualificacao(input: Omit<QualificacaoLead, "id">): Promise<QualificacaoLead> {
    const [row] = await db
      .insert(qualificacaoLead)
      .values({
        leadId: input.leadId,
        resumoQualificacao: input.resumoQualificacao,
        doresIdentificadas: input.doresIdentificadas,
        objecoes: input.objecoes,
        proximoPasso: input.proximoPasso,
        documentosEnviados: input.documentosEnviados,
        linksRelevantes: input.linksRelevantes,
      })
      .returning();

    if (!row) throw new Error("Falha ao criar QualificacaoLead: nenhuma linha retornada.");
    return qualificacaoParaDominio(row);
  }

  async buscarQualificacaoMaisRecente(leadId: string): Promise<QualificacaoLead | null> {
    const [row] = await db
      .select()
      .from(qualificacaoLead)
      .where(eq(qualificacaoLead.leadId, leadId))
      .orderBy(desc(qualificacaoLead.createdAt))
      .limit(1);
    return row ? qualificacaoParaDominio(row) : null;
  }

  async criarAgendamento(input: Omit<AgendamentoComercial, "id">): Promise<AgendamentoComercial> {
    const [row] = await db
      .insert(agendamentoComercial)
      .values({
        leadId: input.leadId,
        googleCalendarEventId: input.googleCalendarEventId,
        dataHora: input.dataHora,
        status: input.status,
        reuniaoId: input.reuniaoId,
      })
      .returning();

    if (!row) throw new Error("Falha ao criar AgendamentoComercial: nenhuma linha retornada.");
    return agendamentoParaDominio(row);
  }

  async atualizarStatusAgendamento(id: string, status: StatusAgendamentoComercial): Promise<void> {
    await db
      .update(agendamentoComercial)
      .set({ status, updatedAt: new Date() })
      .where(eq(agendamentoComercial.id, id));
  }

  async buscarAgendamentoMaisRecente(leadId: string): Promise<AgendamentoComercial | null> {
    const [row] = await db
      .select()
      .from(agendamentoComercial)
      .where(eq(agendamentoComercial.leadId, leadId))
      .orderBy(desc(agendamentoComercial.createdAt))
      .limit(1);
    return row ? agendamentoParaDominio(row) : null;
  }
}
