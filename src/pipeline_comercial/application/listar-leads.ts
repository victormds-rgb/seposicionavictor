import type { LeadRepository, FiltrosLead } from "@/pipeline_comercial/domain/lead-repository";

export async function listarLeads(filtros: FiltrosLead, deps: { leadRepository: LeadRepository }) {
  return deps.leadRepository.listar(filtros);
}
