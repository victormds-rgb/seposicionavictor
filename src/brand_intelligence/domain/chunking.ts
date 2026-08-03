import { createHash } from "node:crypto";

/**
 * Funções puras de apoio à indexação — sem I/O.
 */

export function calcularHash(conteudo: string): string {
  return createHash("sha256").update(conteudo).digest("hex");
}

/**
 * Divide o conteúdo em chunks por parágrafo, respeitando um tamanho
 * máximo aproximado por chunk (caracteres). Estratégia simples e
 * determinística — suficiente para busca textual (ver
 * ConsultorDeBrandIntelligence); um pipeline de embeddings real
 * poderia substituir esta função sem alterar o restante do domínio.
 */
export function dividirEmChunks(conteudo: string, tamanhoMaximoPorChunk = 1000): string[] {
  const paragrafos = conteudo
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];
  let chunkAtual = "";

  for (const paragrafo of paragrafos) {
    if (chunkAtual.length + paragrafo.length + 2 > tamanhoMaximoPorChunk && chunkAtual.length > 0) {
      chunks.push(chunkAtual);
      chunkAtual = paragrafo;
    } else {
      chunkAtual = chunkAtual.length > 0 ? `${chunkAtual}\n\n${paragrafo}` : paragrafo;
    }
  }
  if (chunkAtual.length > 0) chunks.push(chunkAtual);

  return chunks;
}
