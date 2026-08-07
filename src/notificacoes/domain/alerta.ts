/**
 * Domínio do Alerta (Bounded Context Notificações) — DOMAIN_MODEL.md,
 * SOM Cap. 8.
 */

export const TIPOS_ALERTA = [
  "build_log_ausente",
  "auditoria_devida",
  "desvio_pilares",
  "drift_critico",
] as const;
export type TipoAlerta = (typeof TIPOS_ALERTA)[number];

export const STATUS_ALERTA = ["ativo", "reconhecido", "resolvido"] as const;
export type StatusAlerta = (typeof STATUS_ALERTA)[number];

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  condicaoGatilho: string;
  entidadeRelacionadaTipo: string | null;
  entidadeRelacionadaId: string | null;
  status: StatusAlerta;
  dataDisparo: Date;
  dataResolucao: Date | null;
  metadata: Record<string, unknown> | null;
}

export function podeSerReconhecido(alerta: Pick<Alerta, "status">): boolean {
  return alerta.status === "ativo";
}

/**
 * Invariante (DOMAIN_MODEL.md): "`build_log_ausente` só resolvido
 * pela publicação de novo BuildLog" — nunca por dispensa manual sem
 * essa ação, preservando a regra de frequência mínima (SOM Cap. 4.5).
 */
export function podeSerResolvidoManualmente(alerta: Pick<Alerta, "tipo" | "status">): boolean {
  if (alerta.tipo === "build_log_ausente") return false;
  return alerta.status === "ativo" || alerta.status === "reconhecido";
}
