"use server";

import { revalidatePath } from "next/cache";
import { converterLeadEmCliente } from "@/clientes/application/converter-lead-em-cliente";
import { criarDependenciasDeClientes } from "@/clientes/infrastructure/composicao";
import { logarFalhaEPropagar } from "@infra/logging/logger";

export async function converterLeadEmClienteAction(formData: FormData) {
  const deps = criarDependenciasDeClientes();

  try {
    await converterLeadEmCliente(
      {
        leadId: String(formData.get("leadId")),
        nome: formData.get("nome") ? String(formData.get("nome")) : undefined,
        setor: formData.get("setor") ? String(formData.get("setor")) : undefined,
        temAutoridadeReal: formData.get("temAutoridadeReal") === "sim",
        aceitaDiagnostico: formData.get("aceitaDiagnostico") === "sim",
        sinalNaoCumprimento: formData.get("sinalNaoCumprimento") === "sim",
      },
      deps
    );
  } catch (erro) {
    logarFalhaEPropagar("converterLeadEmClienteAction", erro);
  }

  revalidatePath("/clientes");
  revalidatePath("/pipeline");
}
