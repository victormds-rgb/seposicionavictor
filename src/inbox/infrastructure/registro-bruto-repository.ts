import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "@infra/persistence/db/client";
import { registroBruto, registroBrutoDestino } from "@infra/persistence/db/schema";
import type {
  RegistroBrutoRepository,
  FiltrosRegistroBruto,
} from "@/inbox/domain/registro-bruto-repository";
import type { RegistroBruto, StatusRegistroBruto } from "@/inbox/domain/registro-bruto";
import type { RegistroBrutoDestino } from "@/inbox/domain/registro-bruto-destino";

type RegistroBrutoRow = typeof registroBruto.$inferSelect;

function paraDominio(row: RegistroBrutoRow): RegistroBruto {
  return {
    id: row.id,
    tipoEntrada: row.tipoEntrada as RegistroBruto["tipoEntrada"],
    conteudoTexto: row.conteudoTexto,
    conteudoBinarioRef: row.conteudoBinarioRef,
    mimeType: row.mimeType,
    tamanhoBytes: row.tamanhoBytes,
    dataCaptura: row.dataCaptura,
    origem: row.origem as RegistroBruto["origem"],
    reuniaoId: row.reuniaoId,
    status: row.status as StatusRegistroBruto,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}

export class DrizzleRegistroBrutoRepository implements RegistroBrutoRepository {
  async criar(registro: Omit<RegistroBruto, "id">): Promise<RegistroBruto> {
    const [row] = await db
      .insert(registroBruto)
      .values({
        tipoEntrada: registro.tipoEntrada,
        conteudoTexto: registro.conteudoTexto,
        conteudoBinarioRef: registro.conteudoBinarioRef,
        mimeType: registro.mimeType,
        tamanhoBytes: registro.tamanhoBytes,
        dataCaptura: registro.dataCaptura,
        origem: registro.origem,
        reuniaoId: registro.reuniaoId,
        status: registro.status,
        metadata: registro.metadata,
      })
      .returning();

    if (!row) {
      throw new Error("Falha ao criar RegistroBruto: nenhuma linha retornada.");
    }
    return paraDominio(row);
  }

  async buscarPorId(id: string): Promise<RegistroBruto | null> {
    const [row] = await db.select().from(registroBruto).where(eq(registroBruto.id, id)).limit(1);
    return row ? paraDominio(row) : null;
  }

  async atualizarStatus(id: string, status: StatusRegistroBruto): Promise<void> {
    await db
      .update(registroBruto)
      .set({ status, updatedAt: new Date() })
      .where(eq(registroBruto.id, id));
  }

  async atualizarConteudoTexto(id: string, conteudoTexto: string): Promise<void> {
    await db
      .update(registroBruto)
      .set({ conteudoTexto, updatedAt: new Date() })
      .where(eq(registroBruto.id, id));
  }

  async listar(filtros: FiltrosRegistroBruto): Promise<RegistroBruto[]> {
    const condicoes = [];
    if (filtros.status) condicoes.push(eq(registroBruto.status, filtros.status));
    if (filtros.tipoEntrada) condicoes.push(eq(registroBruto.tipoEntrada, filtros.tipoEntrada));
    if (filtros.origem) condicoes.push(eq(registroBruto.origem, filtros.origem));
    if (filtros.textoBusca) {
      condicoes.push(ilike(registroBruto.conteudoTexto, `%${filtros.textoBusca}%`));
    }
    if (filtros.reuniaoId) condicoes.push(eq(registroBruto.reuniaoId, filtros.reuniaoId));

    const rows = await db
      .select()
      .from(registroBruto)
      .where(condicoes.length > 0 ? and(...condicoes) : undefined)
      .orderBy(desc(registroBruto.dataCaptura));

    return rows.map(paraDominio);
  }

  async criarDestino(input: {
    registroBrutoId: string;
    tipoDestino: RegistroBrutoDestino["tipoDestino"];
    destinoId: string;
  }): Promise<RegistroBrutoDestino> {
    const [row] = await db
      .insert(registroBrutoDestino)
      .values({
        registroBrutoId: input.registroBrutoId,
        tipoDestino: input.tipoDestino,
        destinoId: input.destinoId,
      })
      .returning();

    if (!row) {
      throw new Error("Falha ao criar RegistroBrutoDestino: nenhuma linha retornada.");
    }

    return {
      id: row.id,
      registroBrutoId: row.registroBrutoId,
      tipoDestino: row.tipoDestino as RegistroBrutoDestino["tipoDestino"],
      destinoId: row.destinoId,
      createdAt: row.createdAt,
    };
  }

  async listarDestinos(registroBrutoId: string): Promise<RegistroBrutoDestino[]> {
    const rows = await db
      .select()
      .from(registroBrutoDestino)
      .where(eq(registroBrutoDestino.registroBrutoId, registroBrutoId));

    return rows.map((row) => ({
      id: row.id,
      registroBrutoId: row.registroBrutoId,
      tipoDestino: row.tipoDestino as RegistroBrutoDestino["tipoDestino"],
      destinoId: row.destinoId,
      createdAt: row.createdAt,
    }));
  }
}
