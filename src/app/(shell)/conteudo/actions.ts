"use server";

import { revalidatePath } from "next/cache";
import { criarPecaDeConteudo } from "@/conteudo/application/criar-peca-de-conteudo";
import { criarDerivacao } from "@/conteudo/application/criar-derivacao";
import { avancarStatusDaPeca, publicarPeca } from "@/conteudo/application/transicoes-de-status";
import { criarDependenciasDeConteudo } from "@/conteudo/infrastructure/composicao";
import { logarFalhaEPropagar } from "@infra/logging/logger";

export async function criarPecaAction(formData: FormData) {
  const deps = criarDependenciasDeConteudo();

  try {
    await criarPecaDeConteudo(
      {
        canal: String(formData.get("canal")),
        pilarId: String(formData.get("pilarId")),
        origemTipo: String(formData.get("origemTipo") ?? "autonomo"),
        conteudoTexto: formData.get("conteudoTexto") ? String(formData.get("conteudoTexto")) : undefined,
      },
      { pecaDeConteudoRepository: deps.pecaDeConteudoRepository, eventPublisher: deps.eventPublisher }
    );
  } catch (erro) {
    logarFalhaEPropagar("criarPecaAction", erro);
  }

  revalidatePath("/conteudo");
}

export async function criarDerivacaoAction(formData: FormData) {
  const deps = criarDependenciasDeConteudo();

  // DerivacaoInvalidaError propaga naturalmente — Next.js exibe o
  // erro na fronteira mais próxima (error boundary); nenhuma peça é
  // criada quando a derivação viola a regra unidirecional.
  try {
    await criarDerivacao(
      {
        pecaOrigemId: String(formData.get("pecaOrigemId")),
        canalDerivada: String(formData.get("canalDerivada")),
        pilarId: String(formData.get("pilarId")),
      },
      { pecaDeConteudoRepository: deps.pecaDeConteudoRepository }
    );
  } catch (erro) {
    logarFalhaEPropagar("criarDerivacaoAction", erro);
  }

  revalidatePath("/conteudo");
}

export async function avancarStatusAction(formData: FormData) {
  const deps = criarDependenciasDeConteudo();
  try {
    await avancarStatusDaPeca(String(formData.get("pecaId")), {
      pecaDeConteudoRepository: deps.pecaDeConteudoRepository,
      eventPublisher: deps.eventPublisher,
    });
  } catch (erro) {
    logarFalhaEPropagar("avancarStatusAction", erro);
  }
  revalidatePath("/conteudo");
}

export async function publicarPecaAction(formData: FormData) {
  const deps = criarDependenciasDeConteudo();
  try {
    await publicarPeca(String(formData.get("pecaId")), {
      pecaDeConteudoRepository: deps.pecaDeConteudoRepository,
      eventPublisher: deps.eventPublisher,
    });
  } catch (erro) {
    logarFalhaEPropagar("publicarPecaAction", erro);
  }
  revalidatePath("/conteudo");
  revalidatePath("/dashboard");
}
