/**
 * Domínio do DocumentoOficial (Bounded Context Brand Intelligence) —
 * DATABASE.md, refinamento pré-ARCHITECTURE, item 6; ARCHITECTURE.md,
 * seção 21.
 */

export const TIPOS_DOCUMENTO = ["sistema_operacional_marca", "manual_marca", "outro"] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export const STATUS_INDEXACAO = ["nao_indexado", "indexado", "desatualizado", "erro"] as const;
export type StatusIndexacao = (typeof STATUS_INDEXACAO)[number];

export interface DocumentoOficial {
  id: string;
  titulo: string;
  googleDriveFileId: string;
  tipoDocumento: TipoDocumento;
  ultimaSincronizacao: Date | null;
  hashConteudo: string | null;
  statusIndexacao: StatusIndexacao;
  metadata: Record<string, unknown> | null;
}

/**
 * Invariante: um documento nunca sincronizado (hashConteudo null)
 * está sempre "mudou" na primeira verificação — força a primeira
 * indexação completa.
 */
export function houveMudanca(hashArmazenado: string | null, hashAtual: string): boolean {
  return hashArmazenado === null || hashArmazenado !== hashAtual;
}

/**
 * Invariante (ARCHITECTURE.md, seção 18): "Falhas de integração
 * externa nunca bloqueiam a captura/uso do restante do sistema."
 * Aplicado aqui à sincronização de documentos — uma falha de rede
 * nunca lança exceção não tratada, sempre resulta em status `erro`.
 */
export function statusAposFalha(): StatusIndexacao {
  return "erro";
}
