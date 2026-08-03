import { z } from "zod";
import type { RegistroBrutoRepository } from "@/inbox/domain/registro-bruto-repository";
import type { PortaDeArmazenamentoBinario, ArquivoParaArmazenar } from "@/inbox/domain/porta-de-armazenamento-binario";
import {
  TIPOS_ENTRADA,
  ORIGENS_REGISTRO,
  TIPOS_ENTRADA_TEXTUAIS,
  determinarStatusInicial,
  type RegistroBruto,
} from "@/inbox/domain/registro-bruto";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";
import { classificarRegistroBruto } from "./classificar-registro-bruto";
import type { PortaDeIA } from "@/ia/domain/porta-de-ia";
import type { SugestaoIARepository } from "@/ia/domain/sugestao-ia-repository";

const capturarRegistroBrutoSchema = z
  .object({
    tipoEntrada: z.enum(TIPOS_ENTRADA),
    origem: z.enum(ORIGENS_REGISTRO),
    conteudoTexto: z.string().trim().min(1).optional(),
    reuniaoId: z.string().uuid().optional(),
    arquivo: z
      .object({
        nomeOriginal: z.string().min(1),
        mimeType: z.string().min(1),
        tamanhoBytes: z.number().int().positive(),
        conteudo: z.instanceof(Uint8Array),
      })
      .optional(),
  })
  .refine(
    (input) =>
      TIPOS_ENTRADA_TEXTUAIS.includes(input.tipoEntrada)
        ? !!input.conteudoTexto
        : !!input.arquivo,
    {
      message:
        "Entradas textuais exigem conteudoTexto; entradas binárias exigem arquivo.",
    }
  );

export type CapturarRegistroBrutoInput = z.infer<typeof capturarRegistroBrutoSchema>;

export interface CapturarRegistroBrutoDeps {
  registroBrutoRepository: RegistroBrutoRepository;
  portaDeArmazenamento: PortaDeArmazenamentoBinario;
  portaDeIA: PortaDeIA;
  sugestaoIARepository: SugestaoIARepository;
  eventPublisher?: IEventPublisher;
}

/**
 * Use Case: capturar qualquer tipo de entrada na Inbox Universal.
 *
 * Fluxo (ARCHITECTURE.md, seção 6): Captura → Persistência inicial →
 * Classificação por IA (disparada automaticamente aqui apenas para
 * conteúdo já textual) → aguarda confirmação humana (Use Case
 * separado, responder-sugestao.ts).
 */
export async function capturarRegistroBruto(
  inputBruto: unknown,
  deps: CapturarRegistroBrutoDeps
): Promise<RegistroBruto> {
  const input = capturarRegistroBrutoSchema.parse(inputBruto);

  let conteudoBinarioRef: string | null = null;
  let mimeType: string | null = null;
  let tamanhoBytes: number | null = null;

  if (input.arquivo) {
    const arquivo: ArquivoParaArmazenar = {
      nomeOriginal: input.arquivo.nomeOriginal,
      mimeType: input.arquivo.mimeType,
      tamanhoBytes: input.arquivo.tamanhoBytes,
      conteudo: input.arquivo.conteudo,
    };
    const resultado = await deps.portaDeArmazenamento.armazenar(arquivo);
    conteudoBinarioRef = resultado.referencia;
    mimeType = input.arquivo.mimeType;
    tamanhoBytes = input.arquivo.tamanhoBytes;
  }

  const status = determinarStatusInicial(input.tipoEntrada);

  const registro = await deps.registroBrutoRepository.criar({
    tipoEntrada: input.tipoEntrada,
    conteudoTexto: input.conteudoTexto ?? null,
    conteudoBinarioRef,
    mimeType,
    tamanhoBytes,
    dataCaptura: new Date(),
    origem: input.origem,
    reuniaoId: input.reuniaoId ?? null,
    status,
    metadata: null,
  });

  await deps.eventPublisher?.publicar({
    aggregate: "registro_bruto",
    aggregateId: registro.id,
    eventName: "registro_bruto.criado",
    payload: { tipoEntrada: registro.tipoEntrada, origem: registro.origem, status: registro.status },
    actorTipo: "humano",
    source: "inbox.capturar",
  });

  // Classificação automática apenas quando o conteúdo textual já está
  // disponível — entradas binárias permanecem em `em_processamento`
  // até um pipeline de transcrição/OCR (fora do escopo desta Sprint).
  if (status === "capturado" && registro.conteudoTexto) {
    await classificarRegistroBruto(registro.id, {
      registroBrutoRepository: deps.registroBrutoRepository,
      portaDeIA: deps.portaDeIA,
      sugestaoIARepository: deps.sugestaoIARepository,
    });
    // O status foi atualizado dentro de classificarRegistroBruto —
    // o objeto local precisa refletir isso antes de ser retornado
    // (bug real encontrado pelo teste de integração da Sprint 2).
    const registroAtualizado = await deps.registroBrutoRepository.buscarPorId(registro.id);
    return registroAtualizado ?? registro;
  }

  return registro;
}
