/**
 * Domínio do Fundamento — Sprint 9 (leitura mínima).
 *
 * O Fundamento já existe desde a Sprint 0 (schema + seed), mas nenhum
 * repositório de domínio havia sido construído até agora — a
 * AuditoriaDeDrift (Sprint 9) precisa consultar `fraseAncora` para o
 * checklist automatizável (SOM Cap. 2.7). Apenas leitura: nenhuma
 * escrita é exposta aqui — edição do Fundamento continua sendo ação
 * humana direta e deliberada (SOM Cap. 8.3), fora do escopo de
 * qualquer Use Case desta Sprint.
 */
export interface Fundamento {
  id: string;
  filosofia: string;
  bigIdea: string;
  fraseAncora: string;
  manifesto: string;
  principiosOperacionais: string[];
  naoE: string[];
  status: "ativo" | "em_revisao";
  versao: number;
}

export interface FundamentoRepository {
  buscarAtivo(): Promise<Fundamento | null>;
}
