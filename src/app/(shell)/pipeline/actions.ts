"use server";

import { revalidatePath } from "next/cache";
import { criarLead } from "@/pipeline_comercial/application/criar-lead";
import { qualificarLead } from "@/pipeline_comercial/application/qualificar-lead";
import { agendarComercial } from "@/pipeline_comercial/application/agendar-comercial";
import { marcarLeadComoReunido } from "@/pipeline_comercial/application/marcar-lead-como-reunido";
import { criarDependenciasDoPipelineComercial } from "@/pipeline_comercial/infrastructure/composicao";
import { logarFalhaEPropagar } from "@infra/logging/logger";

export async function criarLeadAction(formData: FormData) {
  const deps = criarDependenciasDoPipelineComercial();
  const ticketEstimado = formData.get("ticketEstimado");

  try {
    await criarLead(
      {
        nome: String(formData.get("nome")),
        origemLead: formData.get("origemLead") ? String(formData.get("origemLead")) : undefined,
        sdrResponsavel: formData.get("sdrResponsavel")
          ? String(formData.get("sdrResponsavel"))
          : undefined,
        temperatura: formData.get("temperatura") ? String(formData.get("temperatura")) : undefined,
        ticketEstimado: ticketEstimado ? Number(ticketEstimado) : undefined,
      },
      { leadRepository: deps.leadRepository }
    );
  } catch (erro) {
    logarFalhaEPropagar("criarLeadAction", erro);
  }

  revalidatePath("/pipeline");
}

export async function qualificarLeadAction(formData: FormData) {
  const deps = criarDependenciasDoPipelineComercial();

  try {
    await qualificarLead(
      {
        leadId: String(formData.get("leadId")),
        resumoQualificacao: formData.get("resumoQualificacao")
          ? String(formData.get("resumoQualificacao"))
          : undefined,
        objecoes: formData.get("objecoes") ? String(formData.get("objecoes")) : undefined,
        proximoPasso: formData.get("proximoPasso") ? String(formData.get("proximoPasso")) : undefined,
      },
      { leadRepository: deps.leadRepository }
    );
  } catch (erro) {
    logarFalhaEPropagar("qualificarLeadAction", erro);
  }

  revalidatePath("/pipeline");
}

export async function agendarComercialAction(formData: FormData) {
  const deps = criarDependenciasDoPipelineComercial();

  try {
    await agendarComercial(
      {
        leadId: String(formData.get("leadId")),
        dataHora: String(formData.get("dataHora")),
      },
      deps
    );
  } catch (erro) {
    logarFalhaEPropagar("agendarComercialAction", erro);
  }

  revalidatePath("/pipeline");
  revalidatePath("/agenda");
}

export async function marcarLeadComoReunidoAction(formData: FormData) {
  const deps = criarDependenciasDoPipelineComercial();

  try {
    await marcarLeadComoReunido(String(formData.get("leadId")), {
      leadRepository: deps.leadRepository,
    });
  } catch (erro) {
    logarFalhaEPropagar("marcarLeadComoReunidoAction", erro);
  }

  revalidatePath("/pipeline");
}
