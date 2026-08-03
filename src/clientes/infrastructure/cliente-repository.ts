import { and, eq } from "drizzle-orm";
import { db } from "@infra/persistence/db/client";
import { cliente } from "@infra/persistence/db/schema";
import type { ClienteRepository, FiltrosCliente } from "@/clientes/domain/cliente-repository";
import type { Cliente, StatusCliente } from "@/clientes/domain/cliente";
import type { ClassificacaoCliente } from "@/clientes/domain/regra-de-decisao-cliente";

type ClienteRow = typeof cliente.$inferSelect;

function paraDominio(row: ClienteRow): Cliente {
  return {
    id: row.id,
    nome: row.nome,
    setor: row.setor,
    temAutoridadeReal: row.temAutoridadeReal,
    aceitaDiagnostico: row.aceitaDiagnostico,
    sinalNaoCumprimento: row.sinalNaoCumprimento,
    classificacaoResultante: row.classificacaoResultante as ClassificacaoCliente | null,
    urgenciaFinanceira: row.urgenciaFinanceira as Cliente["urgenciaFinanceira"],
    status: row.status as StatusCliente,
    origemLeadId: row.origemLeadId,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}

export class DrizzleClienteRepository implements ClienteRepository {
  async criar(input: Omit<Cliente, "id">): Promise<Cliente> {
    const [row] = await db
      .insert(cliente)
      .values({
        nome: input.nome,
        setor: input.setor,
        temAutoridadeReal: input.temAutoridadeReal,
        aceitaDiagnostico: input.aceitaDiagnostico,
        sinalNaoCumprimento: input.sinalNaoCumprimento,
        classificacaoResultante: input.classificacaoResultante,
        urgenciaFinanceira: input.urgenciaFinanceira,
        status: input.status,
        origemLeadId: input.origemLeadId,
        metadata: input.metadata,
      })
      .returning();

    if (!row) throw new Error("Falha ao criar Cliente: nenhuma linha retornada.");
    return paraDominio(row);
  }

  async buscarPorId(id: string): Promise<Cliente | null> {
    const [row] = await db.select().from(cliente).where(eq(cliente.id, id)).limit(1);
    return row ? paraDominio(row) : null;
  }

  async listar(filtros: FiltrosCliente): Promise<Cliente[]> {
    const condicoes = [];
    if (filtros.status) condicoes.push(eq(cliente.status, filtros.status));

    const rows = await db
      .select()
      .from(cliente)
      .where(condicoes.length > 0 ? and(...condicoes) : undefined);

    return rows.map(paraDominio);
  }
}
