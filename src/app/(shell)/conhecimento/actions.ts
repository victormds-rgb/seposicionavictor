"use server";

import { revalidatePath } from "next/cache";
import { registrarAtivoDeConhecimento } from "@/conhecimento/application/registrar-ativo-de-conhecimento";
import { criarDependenciasDeConhecimento } from "@/conhecimento/infrastructure/composicao";
import { logarFalhaEPropagar } from "@infra/logging/logger";

export async function registrarAtivoAction(formData: FormData) {
  const deps = criarDependenciasDeConhecimento();

  try {
    await registrarAtivoDeConhecimento(
      {
        tipo: String(formData.get("tipo")),
        conteudoTextual: String(formData.get("conteudoTextual")),
        origem: formData.get("origem") ? String(formData.get("origem")) : undefined,
      },
      { ativoDeConhecimentoRepository: deps.ativoDeConhecimentoRepository }
    );
  } catch (erro) {
    logarFalhaEPropagar("registrarAtivoAction", erro);
  }

  revalidatePath("/conhecimento");
}
