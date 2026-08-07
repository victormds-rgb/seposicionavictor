"use server";

import { revalidatePath } from "next/cache";
import { reconhecerAlerta, resolverAlerta } from "@/notificacoes/application/gestao-de-alertas";
import { executarAuditoriaDeDrift } from "@/notificacoes/application/executar-auditoria-de-drift";
import { criarDependenciasDeNotificacoes } from "@/notificacoes/infrastructure/composicao";
import { logarFalhaEPropagar } from "@infra/logging/logger";
import { SystemClock } from "@/shared/infrastructure/system-clock";

export async function reconhecerAlertaAction(formData: FormData) {
  const deps = criarDependenciasDeNotificacoes();
  try {
    await reconhecerAlerta(String(formData.get("alertaId")), {
      alertaRepository: deps.alertaRepository,
    });
  } catch (erro) {
    logarFalhaEPropagar("reconhecerAlertaAction", erro);
  }
  revalidatePath("/alertas");
  revalidatePath("/dashboard");
}

export async function resolverAlertaAction(formData: FormData) {
  const deps = criarDependenciasDeNotificacoes();
  try {
    await resolverAlerta(String(formData.get("alertaId")), {
      alertaRepository: deps.alertaRepository,
    });
  } catch (erro) {
    logarFalhaEPropagar("resolverAlertaAction", erro);
  }
  revalidatePath("/alertas");
  revalidatePath("/dashboard");
}

export async function executarAuditoriaAction() {
  const deps = criarDependenciasDeNotificacoes();
  try {
    await executarAuditoriaDeDrift({ ...deps, clock: new SystemClock() });
  } catch (erro) {
    logarFalhaEPropagar("executarAuditoriaAction", erro);
  }
  revalidatePath("/alertas");
  revalidatePath("/dashboard");
}
