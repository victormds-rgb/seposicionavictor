/**
 * TipoDestino — conceito compartilhado entre o Bounded Context Inbox
 * (RegistroBrutoDestino) e o Bounded Context IA (ClassificacaoSugerida).
 *
 * Vive em Shared por ser genuinamente usado por mais de um contexto
 * (CODING_GUIDELINES.md, seção 2 — "Shared: usado com moderação"),
 * evitando que um contexto importe tipo de domínio diretamente do
 * outro.
 */
export const TIPOS_DESTINO = [
  "projeto",
  "build_log",
  "peca_conteudo",
  "tarefa",
  "ativo_conhecimento",
] as const;
export type TipoDestino = (typeof TIPOS_DESTINO)[number];
