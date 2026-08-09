import { and, eq } from "drizzle-orm";
import { db } from "@infra/persistence/db/client";
import { projeto, criterioLancamento } from "@infra/persistence/db/schema";
import type { ProjetoRepository, FiltrosProjeto } from "@/projetos/domain/projeto-repository";
import type { Projeto, StatusProjeto } from "@/projetos/domain/projeto";
import type {
  CriterioDeLancamento,
  StatusCriterioLancamento,
} from "@/projetos/domain/criterio-de-lancamento";

type ProjetoRow = typeof projeto.$inferSelect;
type CriterioRow = typeof criterioLancamento.$inferSelect;

function paraDominio(row: ProjetoRow): Projeto {
  return {
    id: row.id,
    nome: row.nome,
    tipo: row.tipo as Projeto["tipo"],
    clienteId: row.clienteId,
    desculpaInicial: row.desculpaInicial,
    custoMensal: row.custoMensal ? Number(row.custoMensal) : null,
    momentoQuebra: row.momentoQuebra,
    solucao: row.solucao,
    tempoDecorrido: row.tempoDecorrido,
    numeroResultado: row.numeroResultado,
    status: row.status as StatusProjeto,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    criadoEm: row.createdAt,
  };
}

function criterioParaDominio(row: CriterioRow): CriterioDeLancamento {
  return {
    id: row.id,
    projetoId: row.projetoId,
    descricaoFeature: row.descricaoFeature,
    status: row.status as StatusCriterioLancamento,
    dataConfirmacao: row.dataConfirmacao,
  };
}

export class DrizzleProjetoRepository implements ProjetoRepository {
  async criar(input: Omit<Projeto, "id" | "criadoEm">): Promise<Projeto> {
    const [row] = await db
      .insert(projeto)
      .values({
        nome: input.nome,
        tipo: input.tipo,
        clienteId: input.clienteId,
        desculpaInicial: input.desculpaInicial,
        custoMensal: input.custoMensal?.toString(),
        momentoQuebra: input.momentoQuebra,
        solucao: input.solucao,
        tempoDecorrido: input.tempoDecorrido,
        numeroResultado: input.numeroResultado,
        status: input.status,
        metadata: input.metadata,
      })
      .returning();

    if (!row) throw new Error("Falha ao criar Projeto: nenhuma linha retornada.");
    return paraDominio(row);
  }

  async buscarPorId(id: string): Promise<Projeto | null> {
    const [row] = await db.select().from(projeto).where(eq(projeto.id, id)).limit(1);
    return row ? paraDominio(row) : null;
  }

  async atualizarStatus(id: string, status: StatusProjeto): Promise<void> {
    await db.update(projeto).set({ status, updatedAt: new Date() }).where(eq(projeto.id, id));
  }

  async atualizarCamposDeCase(
    id: string,
    campos: Partial<
      Pick<Projeto, "momentoQuebra" | "solucao" | "tempoDecorrido" | "numeroResultado">
    >
  ): Promise<void> {
    const valores: Record<string, unknown> = { updatedAt: new Date() };
    if (campos.momentoQuebra !== undefined) valores.momentoQuebra = campos.momentoQuebra;
    if (campos.solucao !== undefined) valores.solucao = campos.solucao;
    if (campos.tempoDecorrido !== undefined) valores.tempoDecorrido = campos.tempoDecorrido;
    if (campos.numeroResultado !== undefined) valores.numeroResultado = campos.numeroResultado;

    await db.update(projeto).set(valores).where(eq(projeto.id, id));
  }

  async listar(filtros: FiltrosProjeto): Promise<Projeto[]> {
    const condicoes = [];
    if (filtros.status) condicoes.push(eq(projeto.status, filtros.status));
    if (filtros.clienteId) condicoes.push(eq(projeto.clienteId, filtros.clienteId));
    if (filtros.tipo) condicoes.push(eq(projeto.tipo, filtros.tipo));

    const rows = await db
      .select()
      .from(projeto)
      .where(condicoes.length > 0 ? and(...condicoes) : undefined);

    return rows.map(paraDominio);
  }

  async criarCriterioDeLancamento(
    input: Omit<CriterioDeLancamento, "id">
  ): Promise<CriterioDeLancamento> {
    const [row] = await db
      .insert(criterioLancamento)
      .values({
        projetoId: input.projetoId,
        descricaoFeature: input.descricaoFeature,
        status: input.status,
        dataConfirmacao: input.dataConfirmacao,
      })
      .returning();

    if (!row) throw new Error("Falha ao criar CriterioDeLancamento: nenhuma linha retornada.");
    return criterioParaDominio(row);
  }

  async listarCriteriosDeLancamento(projetoId: string): Promise<CriterioDeLancamento[]> {
    const rows = await db
      .select()
      .from(criterioLancamento)
      .where(eq(criterioLancamento.projetoId, projetoId));
    return rows.map(criterioParaDominio);
  }

  async atualizarStatusCriterio(
    id: string,
    status: StatusCriterioLancamento,
    dataConfirmacao: Date | null
  ): Promise<void> {
    await db
      .update(criterioLancamento)
      .set({ status, dataConfirmacao, updatedAt: new Date() })
      .where(eq(criterioLancamento.id, id));
  }

  async buscarCriterioPorId(id: string): Promise<CriterioDeLancamento | null> {
    const [row] = await db
      .select()
      .from(criterioLancamento)
      .where(eq(criterioLancamento.id, id))
      .limit(1);
    return row ? criterioParaDominio(row) : null;
  }
}
