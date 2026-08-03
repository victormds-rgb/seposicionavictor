import type { Reuniao, StatusReuniao } from "./reuniao";

export interface FiltrosReuniao {
  status?: StatusReuniao;
  de?: Date;
  ate?: Date;
}

export interface ReuniaoRepository {
  criar(reuniao: Omit<Reuniao, "id">): Promise<Reuniao>;
  buscarPorId(id: string): Promise<Reuniao | null>;
  atualizarStatus(id: string, status: StatusReuniao): Promise<void>;
  atualizarNotasBrutas(id: string, notasBrutas: string): Promise<void>;
  listar(filtros: FiltrosReuniao): Promise<Reuniao[]>;
}
