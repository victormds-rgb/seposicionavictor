/**
 * Domínio do BuildLog (Bounded Context Build Logs) — DOMAIN_MODEL.md,
 * SOM Cap. 4.4, 4.5.
 */

export const STATUS_BUILD_LOG = ["rascunho", "publicado"] as const;
export type StatusBuildLog = (typeof STATUS_BUILD_LOG)[number];

export interface BuildLog {
  id: string;
  projetoId: string;
  contexto: string | null;
  quebra: string | null;
  decisao: string | null;
  proximoPasso: string | null;
  status: StatusBuildLog;
  dataPublicacao: Date | null;
  metadata: Record<string, unknown> | null;
}

/** Invariante: nunca publicado sem os 4 campos do template preenchidos (SOM Cap. 4.4). */
export function os4CamposCompletos(log: {
  contexto: string | null;
  quebra: string | null;
  decisao: string | null;
  proximoPasso: string | null;
}): boolean {
  return (
    !!log.contexto?.trim() &&
    !!log.quebra?.trim() &&
    !!log.decisao?.trim() &&
    !!log.proximoPasso?.trim()
  );
}

export function podeSerPublicado(log: Parameters<typeof os4CamposCompletos>[0] & { status: StatusBuildLog }): boolean {
  return log.status === "rascunho" && os4CamposCompletos(log);
}
