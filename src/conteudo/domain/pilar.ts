/**
 * Pilares editoriais (Reference Data) — SOM Cap. 9.1.
 * Soma dos 5 pesos-alvo = 100% (invariante do DOMAIN_MODEL.md).
 */
export const PILARES_SOM = [
  { nome: "Diagnóstico de negócio (casos reais)", pesoAlvoPercentual: 30 },
  { nome: "Build in Public", pesoAlvoPercentual: 25 },
  { nome: "Análise crítica de tendência", pesoAlvoPercentual: 20 },
  { nome: "Bastidor pessoal / Quebra-Recuo-Volta", pesoAlvoPercentual: 15 },
  { nome: "Educação prática (frameworks)", pesoAlvoPercentual: 10 },
] as const;

export function somaDosPesosAlvoValida(pilares: readonly { pesoAlvoPercentual: number }[]): boolean {
  const soma = pilares.reduce((acc, p) => acc + p.pesoAlvoPercentual, 0);
  return Math.abs(soma - 100) < 0.001;
}
