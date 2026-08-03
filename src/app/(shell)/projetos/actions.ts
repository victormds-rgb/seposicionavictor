"use server";

import { revalidatePath } from "next/cache";
import { criarProjeto } from "@/projetos/application/criar-projeto";
import { atualizarCamposDeCaseDoProjeto } from "@/projetos/application/atualizar-campos-de-case-do-projeto";
import {
  criarCriterioDeLancamento,
  satisfazerCriterioDeLancamento,
} from "@/projetos/application/criterio-de-lancamento";
import { encerrarProjeto } from "@/projetos/application/listar-e-encerrar-projeto";
import { criarCaseAPartirDeProjeto } from "@/cases/application/criar-case-a-partir-de-projeto";
import { atualizarCamposDoCase } from "@/cases/application/atualizar-campos-do-case";
import { publicarCase } from "@/cases/application/publicar-case";
import {
  criarBuildLog,
  atualizarCamposDoBuildLog,
  publicarBuildLog,
} from "@/build_logs/application/build-log-use-cases";
import { criarDependenciasDeProjetos } from "@/projetos/infrastructure/composicao";
import { logarFalhaEPropagar } from "@infra/logging/logger";

export async function criarProjetoAction(formData: FormData) {
  const deps = criarDependenciasDeProjetos();
  const custoMensal = formData.get("custoMensal");
  const clienteId = formData.get("clienteId");

  try {
    await criarProjeto(
      {
        nome: String(formData.get("nome")),
        tipo: String(formData.get("tipo")),
        clienteId: clienteId ? String(clienteId) : undefined,
        desculpaInicial: formData.get("desculpaInicial")
          ? String(formData.get("desculpaInicial"))
          : undefined,
        custoMensal: custoMensal ? Number(custoMensal) : undefined,
      },
      { projetoRepository: deps.projetoRepository, eventPublisher: deps.eventPublisher }
    );
  } catch (erro) {
    logarFalhaEPropagar("criarProjetoAction", erro);
  }

  revalidatePath("/projetos");
}

export async function atualizarCamposDeCaseAction(formData: FormData) {
  const deps = criarDependenciasDeProjetos();

  try {
    await atualizarCamposDeCaseDoProjeto(
      {
        projetoId: String(formData.get("projetoId")),
        momentoQuebra: formData.get("momentoQuebra")
          ? String(formData.get("momentoQuebra"))
          : undefined,
        solucao: formData.get("solucao") ? String(formData.get("solucao")) : undefined,
        tempoDecorrido: formData.get("tempoDecorrido")
          ? String(formData.get("tempoDecorrido"))
          : undefined,
        numeroResultado: formData.get("numeroResultado")
          ? String(formData.get("numeroResultado"))
          : undefined,
      },
      { projetoRepository: deps.projetoRepository, eventPublisher: deps.eventPublisher }
    );
  } catch (erro) {
    logarFalhaEPropagar("atualizarCamposDeCaseAction", erro);
  }

  revalidatePath("/projetos");
}

export async function criarCriterioAction(formData: FormData) {
  const deps = criarDependenciasDeProjetos();

  try {
    await criarCriterioDeLancamento(
      {
        projetoId: String(formData.get("projetoId")),
        descricaoFeature: String(formData.get("descricaoFeature")),
      },
      { projetoRepository: deps.projetoRepository }
    );
  } catch (erro) {
    logarFalhaEPropagar("criarCriterioAction", erro);
  }

  revalidatePath("/projetos");
}

export async function satisfazerCriterioAction(formData: FormData) {
  const deps = criarDependenciasDeProjetos();
  try {
    await satisfazerCriterioDeLancamento(String(formData.get("criterioId")), {
      projetoRepository: deps.projetoRepository,
      eventPublisher: deps.eventPublisher,
    });
  } catch (erro) {
    logarFalhaEPropagar("satisfazerCriterioAction", erro);
  }
  revalidatePath("/projetos");
}

export async function encerrarProjetoAction(formData: FormData) {
  const deps = criarDependenciasDeProjetos();
  try {
    await encerrarProjeto(String(formData.get("projetoId")), {
      projetoRepository: deps.projetoRepository,
    });
  } catch (erro) {
    logarFalhaEPropagar("encerrarProjetoAction", erro);
  }
  revalidatePath("/projetos");
}

export async function criarCaseAction(formData: FormData) {
  const deps = criarDependenciasDeProjetos();
  try {
    await criarCaseAPartirDeProjeto(String(formData.get("projetoId")), deps);
  } catch (erro) {
    logarFalhaEPropagar("criarCaseAction", erro);
  }
  revalidatePath("/projetos");
  revalidatePath("/conteudo");
}

export async function atualizarCaseAction(formData: FormData) {
  const deps = criarDependenciasDeProjetos();
  const custo = formData.get("custo");

  try {
    await atualizarCamposDoCase(
      {
        caseId: String(formData.get("caseId")),
        desculpa: formData.get("desculpa") ? String(formData.get("desculpa")) : undefined,
        custo: custo ? Number(custo) : undefined,
        momentoQuebra: formData.get("momentoQuebra")
          ? String(formData.get("momentoQuebra"))
          : undefined,
        solucao: formData.get("solucao") ? String(formData.get("solucao")) : undefined,
        tempo: formData.get("tempo") ? String(formData.get("tempo")) : undefined,
        numeroResultado: formData.get("numeroResultado")
          ? String(formData.get("numeroResultado"))
          : undefined,
        canalEscolhido: formData.get("canalEscolhido")
          ? String(formData.get("canalEscolhido"))
          : undefined,
      },
      { caseRepository: deps.caseRepository, eventPublisher: deps.eventPublisher }
    );
  } catch (erro) {
    logarFalhaEPropagar("atualizarCaseAction", erro);
  }

  revalidatePath("/projetos");
}

export async function publicarCaseAction(formData: FormData) {
  const deps = criarDependenciasDeProjetos();
  try {
    await publicarCase(String(formData.get("caseId")), { caseRepository: deps.caseRepository, eventPublisher: deps.eventPublisher });
  } catch (erro) {
    logarFalhaEPropagar("publicarCaseAction", erro);
  }
  revalidatePath("/projetos");
}

export async function criarBuildLogAction(formData: FormData) {
  const deps = criarDependenciasDeProjetos();

  try {
    await criarBuildLog(
      {
        projetoId: String(formData.get("projetoId")),
        contexto: formData.get("contexto") ? String(formData.get("contexto")) : undefined,
        quebra: formData.get("quebra") ? String(formData.get("quebra")) : undefined,
        decisao: formData.get("decisao") ? String(formData.get("decisao")) : undefined,
        proximoPasso: formData.get("proximoPasso") ? String(formData.get("proximoPasso")) : undefined,
      },
      { buildLogRepository: deps.buildLogRepository }
    );
  } catch (erro) {
    logarFalhaEPropagar("criarBuildLogAction", erro);
  }

  revalidatePath("/projetos");
}

export async function atualizarBuildLogAction(formData: FormData) {
  const deps = criarDependenciasDeProjetos();

  try {
    await atualizarCamposDoBuildLog(
      {
        buildLogId: String(formData.get("buildLogId")),
        contexto: formData.get("contexto") ? String(formData.get("contexto")) : undefined,
        quebra: formData.get("quebra") ? String(formData.get("quebra")) : undefined,
        decisao: formData.get("decisao") ? String(formData.get("decisao")) : undefined,
        proximoPasso: formData.get("proximoPasso") ? String(formData.get("proximoPasso")) : undefined,
      },
      { buildLogRepository: deps.buildLogRepository }
    );
  } catch (erro) {
    logarFalhaEPropagar("atualizarBuildLogAction", erro);
  }

  revalidatePath("/projetos");
}

export async function publicarBuildLogAction(formData: FormData) {
  const deps = criarDependenciasDeProjetos();
  try {
    await publicarBuildLog(String(formData.get("buildLogId")), {
      buildLogRepository: deps.buildLogRepository,
      eventPublisher: deps.eventPublisher,
    });
  } catch (erro) {
    logarFalhaEPropagar("publicarBuildLogAction", erro);
  }
  revalidatePath("/projetos");
}
