import { randomUUID } from "node:crypto";
import type { SugestaoIARepository } from "@/ia/domain/sugestao-ia-repository";
import type { SugestaoIA, StatusSugestao } from "@/ia/domain/sugestao-ia";

export class FakeSugestaoIARepository implements SugestaoIARepository {
  sugestoes = new Map<string, SugestaoIA>();

  async criar(sugestao: Omit<SugestaoIA, "id">): Promise<SugestaoIA> {
    const nova: SugestaoIA = { ...sugestao, id: randomUUID() };
    this.sugestoes.set(nova.id, nova);
    return nova;
  }

  async buscarPorId(id: string): Promise<SugestaoIA | null> {
    return this.sugestoes.get(id) ?? null;
  }

  async atualizarStatus(
    id: string,
    status: StatusSugestao,
    conteudoSugeridoFinal?: Record<string, unknown>
  ): Promise<void> {
    const sugestao = this.sugestoes.get(id);
    if (sugestao) {
      this.sugestoes.set(id, {
        ...sugestao,
        status,
        conteudoSugerido: conteudoSugeridoFinal ?? sugestao.conteudoSugerido,
      });
    }
  }

  async buscarPendentePorRegistroOrigem(entidadeOrigemId: string): Promise<SugestaoIA | null> {
    return (
      Array.from(this.sugestoes.values()).find(
        (s) => s.entidadeOrigemId === entidadeOrigemId && s.status === "pendente"
      ) ?? null
    );
  }

  async buscarMaisRecentePorRegistroOrigem(entidadeOrigemId: string): Promise<SugestaoIA | null> {
    const candidatas = Array.from(this.sugestoes.values()).filter(
      (s) => s.entidadeOrigemId === entidadeOrigemId
    );
    return candidatas[candidatas.length - 1] ?? null;
  }
}
