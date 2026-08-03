/**
 * Domínio do Case (Bounded Context Cases) — DOMAIN_MODEL.md,
 * SOM Cap. 5.1, 5.4.
 */
import type { Canal } from "@/shared/enums/canal";
export type { Canal } from "@/shared/enums/canal";
export { CANAIS } from "@/shared/enums/canal";

export const STATUS_CASE = ["incompleto", "completo", "publicado"] as const;
export type StatusCase = (typeof STATUS_CASE)[number];

export interface Case {
  id: string;
  projetoId: string;
  desculpa: string | null;
  custo: number | null;
  momentoQuebra: string | null;
  solucao: string | null;
  tempo: string | null;
  numeroResultado: string | null;
  canalSugerido: Canal | null;
  canalEscolhido: Canal | null;
  status: StatusCase;
  metadata: Record<string, unknown> | null;
}

/**
 * Invariante (SOM Cap. 5, checklist): "os 6 campos completos antes de
 * elegível para publicação." Mesma regra aplicada em Projeto
 * (camposDeCaseCompletos), reaproveitada aqui sobre o shape de Case.
 */
export function os6CamposCompletos(caso: {
  desculpa: string | null;
  custo: number | null;
  momentoQuebra: string | null;
  solucao: string | null;
  tempo: string | null;
  numeroResultado: string | null;
}): boolean {
  return (
    !!caso.desculpa?.trim() &&
    caso.custo !== null &&
    !!caso.momentoQuebra?.trim() &&
    !!caso.solucao?.trim() &&
    !!caso.tempo?.trim() &&
    !!caso.numeroResultado?.trim()
  );
}

/** Invariante: nunca `completo` com campo ausente (DOMAIN_MODEL.md). */
export function podeSerMarcadoComoCompleto(caso: Parameters<typeof os6CamposCompletos>[0]): boolean {
  return os6CamposCompletos(caso);
}

/** Invariante: só publica um Case já completo. */
export function podeSerPublicado(caso: Pick<Case, "status">): boolean {
  return caso.status === "completo";
}

/** Sugestão de canal por tipo de case (SOM Cap. 5.4), aplicada como default — nunca vinculante. */
export function sugerirCanalPadrao(): Canal {
  return "linkedin";
}
