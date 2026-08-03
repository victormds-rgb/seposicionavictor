/**
 * Domínio do RegistroBruto (Inbox Universal) — DOMAIN_MODEL.md,
 * DATABASE.md (refinamento pré-ARCHITECTURE, item 1).
 *
 * Regras puras, sem I/O (CODING_GUIDELINES.md, seção 2 — Domain).
 */

export const TIPOS_ENTRADA = [
  "texto",
  "audio",
  "imagem",
  "pdf",
  "video",
  "print",
  "email",
  "documento",
  "link",
  "mensagem",
  "observacao",
  "transcricao",
  "outro",
] as const;
export type TipoEntrada = (typeof TIPOS_ENTRADA)[number];

/** Tipos cujo conteúdo já nasce como texto pronto para classificação. */
export const TIPOS_ENTRADA_TEXTUAIS: readonly TipoEntrada[] = [
  "texto",
  "observacao",
  "mensagem",
  "link",
  "email",
  "transcricao",
];

export const ORIGENS_REGISTRO = [
  "reuniao",
  "aprendizado",
  "ideia",
  "email",
  "whatsapp",
  "outro",
] as const;
export type OrigemRegistro = (typeof ORIGENS_REGISTRO)[number];

export const STATUS_REGISTRO_BRUTO = [
  "capturado",
  "em_processamento",
  "classificacao_sugerida",
  "classificado",
  "descartado",
] as const;
export type StatusRegistroBruto = (typeof STATUS_REGISTRO_BRUTO)[number];

export interface RegistroBruto {
  id: string;
  tipoEntrada: TipoEntrada;
  conteudoTexto: string | null;
  conteudoBinarioRef: string | null;
  mimeType: string | null;
  tamanhoBytes: number | null;
  dataCaptura: Date;
  origem: OrigemRegistro;
  reuniaoId: string | null;
  status: StatusRegistroBruto;
  metadata: Record<string, unknown> | null;
}

export class RegistroBrutoInvalidoError extends Error {}
export class TransicaoDeStatusInvalidaError extends Error {}

/**
 * Determina o status inicial de um RegistroBruto recém-capturado.
 *
 * Regra: entradas textuais (já legíveis) seguem direto para
 * `capturado`, elegíveis à classificação imediata. Entradas binárias
 * (áudio, imagem, PDF, vídeo, print, documento) entram em
 * `em_processamento`, pois dependem de transcrição/OCR — pipeline que
 * NÃO é implementado nesta Sprint (não é integração "estritamente
 * necessária" para a captura em si; ver relatório da Sprint 2).
 */
export function determinarStatusInicial(tipoEntrada: TipoEntrada): StatusRegistroBruto {
  return TIPOS_ENTRADA_TEXTUAIS.includes(tipoEntrada) ? "capturado" : "em_processamento";
}

/**
 * Invariante: um RegistroBruto só pode receber uma sugestão de
 * classificação (SugestaoIA) enquanto seu conteúdo textual já existir
 * e seu status permitir isso.
 */
export function podeSerClassificado(registro: Pick<RegistroBruto, "status" | "conteudoTexto">): boolean {
  return (
    (registro.status === "capturado" || registro.status === "classificacao_sugerida") &&
    registro.conteudoTexto !== null &&
    registro.conteudoTexto.trim().length > 0
  );
}

/**
 * Invariante (DOMAIN_MODEL.md): "Nunca classificado automaticamente
 * sem confirmação humana." Esta função nunca é chamada pelo Domain
 * Service de IA — apenas pelo Use Case de confirmação humana.
 */
export function podeSerConfirmado(registro: Pick<RegistroBruto, "status">): boolean {
  return registro.status === "classificacao_sugerida" || registro.status === "capturado";
}

export function podeSerDescartado(registro: Pick<RegistroBruto, "status">): boolean {
  return registro.status !== "classificado" && registro.status !== "descartado";
}
