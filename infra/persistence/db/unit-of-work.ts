import { db, executarNaTransacao } from "./client";
import type { UnitOfWork } from "@/shared/domain/unit-of-work";

/**
 * Implementação real da UnitOfWork via `db.transaction` (Postgres).
 * Repositórios e o EventLogHandler participam automaticamente desta
 * transação ao chamar `getDb()` em vez de importar `db` diretamente —
 * nenhum precisa receber a transação como parâmetro explícito.
 */
export class DrizzleUnitOfWork implements UnitOfWork {
  async run<T>(work: () => Promise<T>): Promise<T> {
    return db.transaction((tx) => executarNaTransacao(tx, work));
  }
}
