import { eq } from "drizzle-orm";
import { db } from "@infra/persistence/db/client";
import { pilar, serieFixa } from "@infra/persistence/db/schema";
import type {
  PilarRepository,
  SerieFixaRepository,
} from "@/conteudo/domain/peca-de-conteudo-repository";

export class DrizzlePilarRepository implements PilarRepository {
  async listar() {
    const rows = await db.select().from(pilar);
    return rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      pesoAlvoPercentual: Number(r.pesoAlvoPercentual),
    }));
  }

  async buscarPorId(id: string) {
    const [row] = await db.select().from(pilar).where(eq(pilar.id, id)).limit(1);
    return row
      ? { id: row.id, nome: row.nome, pesoAlvoPercentual: Number(row.pesoAlvoPercentual) }
      : null;
  }
}

export class DrizzleSerieFixaRepository implements SerieFixaRepository {
  async listar() {
    const rows = await db.select().from(serieFixa);
    return rows.map((r) => ({ id: r.id, nome: r.nome }));
  }
}
