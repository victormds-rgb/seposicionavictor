"use server";

import { revalidatePath } from "next/cache";
import { agendarReuniao } from "@/reunioes/application/agendar-reuniao";
import { marcarReuniaoComoRealizada } from "@/reunioes/application/marcar-reuniao-como-realizada";
import { marcarReuniaoComoProcessada } from "@/reunioes/application/marcar-reuniao-como-processada";
import { marcarItemComoConcluido } from "@/agenda/application/marcar-item-como-concluido";
import { instanciarRotinaSemanal } from "@/agenda/application/instanciar-rotina-semanal";
import { criarDependenciasDaAgenda } from "@/agenda/infrastructure/composicao";
import { logarFalhaEPropagar } from "@infra/logging/logger";

export async function agendarReuniaoAction(formData: FormData) {
  const deps = criarDependenciasDaAgenda();
  const participantesRaw = String(formData.get("participantes") ?? "");

  try {
    await agendarReuniao(
      {
        dataHora: String(formData.get("dataHora")),
        participantes: participantesRaw
          ? participantesRaw.split(",").map((p) => p.trim()).filter(Boolean)
          : undefined,
        local: formData.get("local") ? String(formData.get("local")) : undefined,
      },
      deps
    );
  } catch (erro) {
    logarFalhaEPropagar("agendarReuniaoAction", erro);
  }

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
}

export async function marcarComoRealizadaAction(formData: FormData) {
  const deps = criarDependenciasDaAgenda();
  const notas = formData.get("notasBrutas");

  try {
    await marcarReuniaoComoRealizada(
      String(formData.get("reuniaoId")),
      notas ? String(notas) : undefined,
      { reuniaoRepository: deps.reuniaoRepository, eventPublisher: deps.eventPublisher }
    );
  } catch (erro) {
    logarFalhaEPropagar("marcarComoRealizadaAction", erro);
  }

  revalidatePath("/agenda");
}

export async function marcarComoProcessadaAction(formData: FormData) {
  const deps = criarDependenciasDaAgenda();

  try {
    await marcarReuniaoComoProcessada(String(formData.get("reuniaoId")), {
      reuniaoRepository: deps.reuniaoRepository,
      registroBrutoRepository: deps.registroBrutoRepository,
      eventPublisher: deps.eventPublisher,
    });
  } catch (erro) {
    logarFalhaEPropagar("marcarComoProcessadaAction", erro);
  }

  revalidatePath("/agenda");
}

export async function marcarItemComoConcluidoAction(formData: FormData) {
  const deps = criarDependenciasDaAgenda();

  try {
    await marcarItemComoConcluido(String(formData.get("itemId")), {
      itemDeAgendaRepository: deps.itemDeAgendaRepository,
    });
  } catch (erro) {
    logarFalhaEPropagar("marcarItemComoConcluidoAction", erro);
  }

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
}

export async function instanciarRotinaSemanalAction(formData: FormData) {
  const deps = criarDependenciasDaAgenda();
  const inicioDaSemana = new Date(String(formData.get("inicioDaSemana")));

  try {
    await instanciarRotinaSemanal(inicioDaSemana, {
      itemDeAgendaRepository: deps.itemDeAgendaRepository,
    });
  } catch (erro) {
    logarFalhaEPropagar("instanciarRotinaSemanalAction", erro);
  }

  revalidatePath("/agenda");
}
