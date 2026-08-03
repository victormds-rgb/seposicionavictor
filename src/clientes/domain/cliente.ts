import type { ClassificacaoCliente } from "./regra-de-decisao-cliente";

export const STATUS_CLIENTE = ["lead", "em_avaliacao", "ativo", "encerrado"] as const;
export type StatusCliente = (typeof STATUS_CLIENTE)[number];

export const URGENCIAS_FINANCEIRAS = ["baixa", "media", "alta"] as const;
export type UrgenciaFinanceira = (typeof URGENCIAS_FINANCEIRAS)[number];

export interface Cliente {
  id: string;
  nome: string;
  setor: string | null;
  temAutoridadeReal: boolean | null;
  aceitaDiagnostico: boolean | null;
  sinalNaoCumprimento: boolean | null;
  classificacaoResultante: ClassificacaoCliente | null;
  urgenciaFinanceira: UrgenciaFinanceira | null;
  status: StatusCliente;
  origemLeadId: string | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Invariante (DOMAIN_MODEL.md): "Nunca classificado `ativo` sem
 * passar pela árvore de decisão completa." As três respostas
 * precisam existir (não `null`) antes de `status` poder ser `ativo`.
 */
export function passouPelaArvoreCompleta(
  cliente: Pick<Cliente, "temAutoridadeReal" | "aceitaDiagnostico" | "sinalNaoCumprimento">
): boolean {
  return (
    cliente.temAutoridadeReal !== null &&
    cliente.aceitaDiagnostico !== null &&
    cliente.sinalNaoCumprimento !== null
  );
}

/**
 * Invariante (DOMAIN_MODEL.md): "`sinal_nao_cumprimento = true` sempre
 * implica exigência de contrato reforçado sinalizada."
 *
 * NOTA DE CONFORMIDADE (Sprint 4): a árvore original do SOM, Cap. 7.1,
 * é sequencial com curto-circuito — se `temAutoridadeReal` ou
 * `aceitaDiagnostico` já forem `false`, a classificação é
 * `cliente_de_caixa` e a árvore NUNCA chega a consultar
 * `sinalNaoCumprimento`. A redação do invariante no DOMAIN_MODEL.md,
 * lida ao pé da letra, pareceria exigir `exigir_contrato_reforcado`
 * mesmo nesses ramos — o que contradiria a própria árvore que ele
 * descreve. Interpretação adotada aqui (documentada, não decidida
 * silenciosamente): o invariante só se aplica ao ramo em que a árvore
 * de fato consulta `sinalNaoCumprimento` (ou seja, quando autoridade
 * real E aceitação de diagnóstico já são verdadeiras) — fora desse
 * ramo, o invariante não se aplica, pois a pergunta nem chega a ser
 * feita.
 */
export function classificacaoConsistenteComSinal(
  respostas: {
    temAutoridadeReal: boolean;
    aceitaDiagnostico: boolean;
    sinalNaoCumprimento: boolean;
  },
  classificacaoResultante: ClassificacaoCliente
): boolean {
  const arvoreChegouAPerguntarSobreSinal = respostas.temAutoridadeReal && respostas.aceitaDiagnostico;
  if (!arvoreChegouAPerguntarSobreSinal) return true;
  if (!respostas.sinalNaoCumprimento) return true;
  return classificacaoResultante === "exigir_contrato_reforcado";
}
