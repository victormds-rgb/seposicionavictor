"use server";

import { revalidatePath } from "next/cache";
import { capturarRegistroBruto } from "@/inbox/application/capturar-registro-bruto";
import { responderSugestao } from "@/inbox/application/responder-sugestao";
import { solicitarNovaSugestao } from "@/inbox/application/solicitar-nova-sugestao";
import { descartarRegistroBruto } from "@/inbox/application/descartar-registro-bruto";
import { criarDependenciasDaInbox } from "@/inbox/infrastructure/composicao";
import { logarFalhaEPropagar } from "@infra/logging/logger";

/**
 * Server Actions — camada de Presentation. Nenhuma regra de negócio
 * vive aqui, apenas tradução de FormData para os Use Cases da
 * Application (CODING_GUIDELINES.md, seção 4 — proibições).
 */

// Limite explícito de upload (Sprint 14 — Hardening Final, item 8) —
// validado ANTES de carregar o arquivo inteiro em memória via
// arrayBuffer(). 10MB é generoso para os tipos aceitos hoje (imagem,
// PDF, áudio, print, documento) sem depender só do limite padrão de
// corpo de Server Action do Next.js como única proteção.
const TAMANHO_MAXIMO_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function capturarTextoAction(formData: FormData) {
  const deps = criarDependenciasDaInbox();
  const reuniaoId = formData.get("reuniaoId");

  try {
    await capturarRegistroBruto(
      {
        tipoEntrada: String(formData.get("tipoEntrada") ?? "texto"),
        origem: String(formData.get("origem") ?? "ideia"),
        conteudoTexto: String(formData.get("conteudoTexto") ?? ""),
        reuniaoId: reuniaoId ? String(reuniaoId) : undefined,
      },
      deps
    );
  } catch (erro) {
    logarFalhaEPropagar("capturarTextoAction", erro);
  }

  revalidatePath("/inbox");
  revalidatePath("/dashboard");
  revalidatePath("/agenda");
}

export async function capturarArquivoAction(formData: FormData) {
  const deps = criarDependenciasDaInbox();
  const arquivo = formData.get("arquivo") as File | null;

  if (!arquivo) {
    throw new Error("Nenhum arquivo enviado.");
  }

  if (arquivo.size > TAMANHO_MAXIMO_UPLOAD_BYTES) {
    throw new Error(
      `Arquivo muito grande (${(arquivo.size / (1024 * 1024)).toFixed(1)}MB). O limite é ${TAMANHO_MAXIMO_UPLOAD_BYTES / (1024 * 1024)}MB.`
    );
  }

  try {
    const buffer = new Uint8Array(await arquivo.arrayBuffer());

    await capturarRegistroBruto(
      {
        tipoEntrada: String(formData.get("tipoEntrada") ?? "documento"),
        origem: String(formData.get("origem") ?? "ideia"),
        arquivo: {
          nomeOriginal: arquivo.name,
          mimeType: arquivo.type || "application/octet-stream",
          tamanhoBytes: arquivo.size,
          conteudo: buffer,
        },
      },
      deps
    );
  } catch (erro) {
    logarFalhaEPropagar("capturarArquivoAction", erro);
  }

  revalidatePath("/inbox");
  revalidatePath("/dashboard");
}

export async function responderSugestaoAction(formData: FormData) {
  const deps = criarDependenciasDaInbox();

  const decisao = String(formData.get("decisao"));
  const tipoDestinoEscolhido = formData.get("tipoDestinoEscolhido");

  try {
    await responderSugestao(
      {
        sugestaoId: String(formData.get("sugestaoId")),
        decisao,
        tipoDestinoEscolhido: tipoDestinoEscolhido ? String(tipoDestinoEscolhido) : undefined,
        motivoRejeicao: formData.get("motivoRejeicao")
          ? String(formData.get("motivoRejeicao"))
          : undefined,
      },
      deps
    );
  } catch (erro) {
    logarFalhaEPropagar("responderSugestaoAction", erro);
  }

  revalidatePath("/inbox");
  revalidatePath("/dashboard");
}

export async function solicitarNovaSugestaoAction(formData: FormData) {
  const deps = criarDependenciasDaInbox();
  try {
    await solicitarNovaSugestao(String(formData.get("sugestaoId")), deps);
  } catch (erro) {
    logarFalhaEPropagar("solicitarNovaSugestaoAction", erro);
  }
  revalidatePath("/inbox");
}

export async function descartarRegistroBrutoAction(formData: FormData) {
  const deps = criarDependenciasDaInbox();
  try {
    await descartarRegistroBruto(String(formData.get("registroBrutoId")), {
      registroBrutoRepository: deps.registroBrutoRepository,
    });
  } catch (erro) {
    logarFalhaEPropagar("descartarRegistroBrutoAction", erro);
  }
  revalidatePath("/inbox");
  revalidatePath("/dashboard");
}
