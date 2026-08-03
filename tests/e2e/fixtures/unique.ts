/**
 * Sufixo único por chamada — usado para nomear entidades criadas em
 * cada teste (Lead, Projeto, Peça, reunião...) de forma que testes
 * rodando em paralelo nunca colidam entre si nem com dados
 * pré-existentes no banco, e que cada teste seja independente dos
 * demais (nenhum reaproveita dado criado por outro).
 */
export function sufixoUnico(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
