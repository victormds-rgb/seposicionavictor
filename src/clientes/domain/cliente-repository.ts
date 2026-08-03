import type { Cliente, StatusCliente } from "./cliente";

export interface FiltrosCliente {
  status?: StatusCliente;
}

export interface ClienteRepository {
  criar(cliente: Omit<Cliente, "id">): Promise<Cliente>;
  buscarPorId(id: string): Promise<Cliente | null>;
  listar(filtros: FiltrosCliente): Promise<Cliente[]>;
}
