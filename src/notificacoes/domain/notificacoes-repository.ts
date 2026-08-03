import type { Alerta, TipoAlerta, StatusAlerta } from "./alerta";
import type { AuditoriaDeDrift, StatusAuditoria } from "./auditoria-de-drift";

export interface FiltrosAlerta {
  status?: StatusAlerta;
  tipo?: TipoAlerta;
}

export interface AlertaRepository {
  criar(alerta: Omit<Alerta, "id">): Promise<Alerta>;
  buscarPorId(id: string): Promise<Alerta | null>;
  buscarAtivoPorTipoEEntidade(
    tipo: TipoAlerta,
    entidadeRelacionadaId: string | null
  ): Promise<Alerta | null>;
  /**
   * Insere um Alerta `ativo` de forma atômica (`ON CONFLICT DO
   * NOTHING` sobre o índice único parcial `(tipo, entidade_relacionada_id)
   * WHERE status = 'ativo'`), fechando a janela entre checar e criar
   * que existia em `buscarAtivoPorTipoEEntidade` + `criar` em sequência.
   * `criado: false` quando já existia um alerta ativo — mesma semântica
   * de retorno que `garantirAlertaAtivo` já tinha.
   */
  garantirAtivo(alerta: Omit<Alerta, "id">): Promise<{ alerta: Alerta; criado: boolean }>;
  atualizarStatus(id: string, status: StatusAlerta, dataResolucao?: Date): Promise<void>;
  listar(filtros: FiltrosAlerta): Promise<Alerta[]>;
}

export interface AuditoriaDeDriftRepository {
  criar(auditoria: Omit<AuditoriaDeDrift, "id">): Promise<AuditoriaDeDrift>;
  buscarPorId(id: string): Promise<AuditoriaDeDrift | null>;
  atualizar(
    id: string,
    dados: Partial<
      Pick<AuditoriaDeDrift, "percentualFalha" | "recomendacaoGerada" | "status" | "pecasAvaliadas">
    >
  ): Promise<void>;
  buscarMaisRecente(): Promise<AuditoriaDeDrift | null>;
  listar(filtros: { status?: StatusAuditoria }): Promise<AuditoriaDeDrift[]>;
}
