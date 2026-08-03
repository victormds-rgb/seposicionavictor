import { eq } from "drizzle-orm";
import { db } from "@infra/persistence/db/client";
import { fundamento } from "@infra/persistence/db/schema";
import type { FundamentoRepository, Fundamento } from "@/fundamento/domain/fundamento";

export class DrizzleFundamentoRepository implements FundamentoRepository {
  async buscarAtivo(): Promise<Fundamento | null> {
    const [row] = await db.select().from(fundamento).where(eq(fundamento.status, "ativo")).limit(1);
    if (!row) return null;

    return {
      id: row.id,
      filosofia: row.filosofia,
      bigIdea: row.bigIdea,
      fraseAncora: row.fraseAncora,
      manifesto: row.manifesto,
      principiosOperacionais: row.principiosOperacionais as string[],
      naoE: row.naoE as string[],
      status: row.status as "ativo" | "em_revisao",
      versao: row.versao,
    };
  }
}
