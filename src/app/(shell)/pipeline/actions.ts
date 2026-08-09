"use server";

import { revalidatePath } from "next/cache";
import { criarLead } from "@/pipeline_comercial/application/criar-lead";
import { qualificarLead } from "@/pipeline_comercial/application/qualificar-lead";
import { agendarComercial } from "@/pipeline_comercial/application/agendar-comercial";
import { marcarLeadComoReunido } from "@/pipeline_comercial/application/marcar-lead-como-reunido";
import { marcarLeadComoPerdido } from "@/pipeline_comercial/application/marcar-lead-como-perdido";
import { registrarContatoComLead } from "@/pipeline_comercial/application/registrar-contato-com-lead";
import { definirProximoContato } from "@/pipeline_comercial/application/definir-proximo-contato";
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
        canalOrigem: formData.get("canalOrigem") ? String(formData.get("canalOrigem")) : undefined,
        campanha: formData.get("campanha") ? String(formData.get("campanha")) : undefined,
        interesse: formData.get("interesse") ? String(formData.get("interesse")) : undefined,
      },
      { leadRepository: deps.leadRepository, eventPublisher: deps.eventPublisher }
    );
  } catch (erro) {
    logarFalhaEPropagar("criarLeadAction", erro);
  }

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
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
      { leadRepository: deps.leadRepository, clock: deps.clock, eventPublisher: deps.eventPublisher }
    );
  } catch (erro) {
    logarFalhaEPropagar("qualificarLeadAction", erro);
  }

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}

export async function marcarLeadComoPerdidoAction(formData: FormData) {
  const deps = criarDependenciasDoPipelineComercial();

  try {
    await marcarLeadComoPerdido(
      {
        leadId: String(formData.get("leadId")),
        motivoPerda: String(formData.get("motivoPerda")),
      },
      { leadRepository: deps.leadRepository, eventPublisher: deps.eventPublisher }
    );
  } catch (erro) {
    logarFalhaEPropagar("marcarLeadComoPerdidoAction", erro);
  }

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}

export async function registrarContatoComLeadAction(formData: FormData) {
  const deps = criarDependenciasDoPipelineComercial();

  try {
    await registrarContatoComLead(
      { leadId: String(formData.get("leadId")) },
      { leadRepository: deps.leadRepository, clock: deps.clock, eventPublisher: deps.eventPublisher }
    );
  } catch (erro) {
    logarFalhaEPropagar("registrarContatoComLeadAction", erro);
  }

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}

export async function definirProximoContatoAction(formData: FormData) {
  const deps = criarDependenciasDoPipelineComercial();

  try {
    await definirProximoContato(
      {
        leadId: String(formData.get("leadId")),
        proximoContatoEm: String(formData.get("proximoContatoEm")),
      },
      { leadRepository: deps.leadRepository, eventPublisher: deps.eventPublisher }
    );
  } catch (erro) {
    logarFalhaEPropagar("definirProximoContatoAction", erro);
  }

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
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
      clock: deps.clock,
      eventPublisher: deps.eventPublisher,
    });
  } catch (erro) {
    logarFalhaEPropagar("marcarLeadComoReunidoAction", erro);
  }

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}
