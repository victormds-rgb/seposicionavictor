import { eq, inArray } from "drizzle-orm";
import { db } from "@infra/persistence/db/client";
import { framework, temaMapeado, temaFramework } from "@infra/persistence/db/schema";
import type {
  FrameworkRepository,
  TemaMapeadoRepository,
} from "@/conhecimento/domain/conhecimento-repository";
import type { Framework, StatusFramework } from "@/conhecimento/domain/framework";

type FrameworkRow = typeof framework.$inferSelect;

function paraDominio(row: FrameworkRow): Framework {
  return {
    id: row.id,
    nome: row.nome,
    estruturaEtapas: row.estruturaEtapas as string[],
    exemplosUso: row.exemplosUso,
    status: row.status as StatusFramework,
  };
}

export class DrizzleFrameworkRepository implements FrameworkRepository {
  async listar(): Promise<Framework[]> {
    const rows = await db.select().from(framework);
    return rows.map(paraDominio);
  }

  async buscarPorNome(nome: string): Promise<Framework | null> {
    const [row] = await db.select().from(framework).where(eq(framework.nome, nome)).limit(1);
    return row ? paraDominio(row) : null;
  }

  async buscarPorId(id: string): Promise<Framework | null> {
    const [row] = await db.select().from(framework).where(eq(framework.id, id)).limit(1);
    return row ? paraDominio(row) : null;
  }
}

export class DrizzleTemaMapeadoRepository implements TemaMapeadoRepository {
  async listar() {
    const temas = await db.select().from(temaMapeado);
    const relacoes = await db.select().from(temaFramework);
    const frameworks = await db.select().from(framework);

    return temas.map((tema) => {
      const frameworkIds = relacoes
        .filter((r) => r.temaId === tema.id)
        .map((r) => r.frameworkId);
      const frameworksDoTema = frameworks
        .filter((f) => frameworkIds.includes(f.id))
        .map(paraDominio);

      return { id: tema.id, nomeTema: tema.nomeTema, frameworks: frameworksDoTema };
    });
  }

  async buscarPorId(id: string) {
    const [tema] = await db.select().from(temaMapeado).where(eq(temaMapeado.id, id)).limit(1);
    if (!tema) return null;

    const relacoes = await db
      .select()
      .from(temaFramework)
      .where(eq(temaFramework.temaId, id));
    const frameworkIds = relacoes.map((r) => r.frameworkId);

    const frameworksDoTema =
      frameworkIds.length > 0
        ? (await db.select().from(framework).where(inArray(framework.id, frameworkIds))).map(
            paraDominio
          )
        : [];

    return { id: tema.id, nomeTema: tema.nomeTema, frameworks: frameworksDoTema };
  }
}
