import { randomUUID } from "node:crypto";
import type {
  RegistroBrutoRepository,
  FiltrosRegistroBruto,
} from "@/inbox/domain/registro-bruto-repository";
import type { RegistroBruto, StatusRegistroBruto } from "@/inbox/domain/registro-bruto";
import type { RegistroBrutoDestino } from "@/inbox/domain/registro-bruto-destino";

export class FakeRegistroBrutoRepository implements RegistroBrutoRepository {
  registros = new Map<string, RegistroBruto>();
  destinos: RegistroBrutoDestino[] = [];

  async criar(registro: Omit<RegistroBruto, "id">): Promise<RegistroBruto> {
    const novo: RegistroBruto = { ...registro, id: randomUUID() };
    this.registros.set(novo.id, novo);
    return novo;
  }

  async buscarPorId(id: string): Promise<RegistroBruto | null> {
    return this.registros.get(id) ?? null;
  }

  async atualizarStatus(id: string, status: StatusRegistroBruto): Promise<void> {
    const registro = this.registros.get(id);
    if (registro) this.registros.set(id, { ...registro, status });
  }

  async atualizarConteudoTexto(id: string, conteudoTexto: string): Promise<void> {
    const registro = this.registros.get(id);
    if (registro) this.registros.set(id, { ...registro, conteudoTexto });
  }

  async listar(filtros: FiltrosRegistroBruto): Promise<RegistroBruto[]> {
    return Array.from(this.registros.values()).filter((r) => {
      if (filtros.status && r.status !== filtros.status) return false;
      if (filtros.tipoEntrada && r.tipoEntrada !== filtros.tipoEntrada) return false;
      if (filtros.origem && r.origem !== filtros.origem) return false;
      if (filtros.textoBusca && !r.conteudoTexto?.includes(filtros.textoBusca)) return false;
      return true;
    });
  }

  async criarDestino(input: {
    registroBrutoId: string;
    tipoDestino: RegistroBrutoDestino["tipoDestino"];
    destinoId: string;
  }): Promise<RegistroBrutoDestino> {
    const destino: RegistroBrutoDestino = { id: randomUUID(), createdAt: new Date(), ...input };
    this.destinos.push(destino);
    return destino;
  }

  async listarDestinos(registroBrutoId: string): Promise<RegistroBrutoDestino[]> {
    return this.destinos.filter((d) => d.registroBrutoId === registroBrutoId);
  }
}
