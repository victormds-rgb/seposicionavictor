import type { RegistroBruto, StatusRegistroBruto, TipoEntrada, OrigemRegistro } from "./registro-bruto";
import type { RegistroBrutoDestino } from "./registro-bruto-destino";
import type { TipoDestino } from "@/shared/enums/tipo-destino";

export interface FiltrosRegistroBruto {
  status?: StatusRegistroBruto;
  tipoEntrada?: TipoEntrada;
  origem?: OrigemRegistro;
  textoBusca?: string;
  reuniaoId?: string;
}

export interface RegistroBrutoRepository {
  criar(registro: Omit<RegistroBruto, "id">): Promise<RegistroBruto>;
  buscarPorId(id: string): Promise<RegistroBruto | null>;
  atualizarStatus(id: string, status: StatusRegistroBruto): Promise<void>;
  atualizarConteudoTexto(id: string, conteudoTexto: string): Promise<void>;
  listar(filtros: FiltrosRegistroBruto): Promise<RegistroBruto[]>;
  criarDestino(input: {
    registroBrutoId: string;
    tipoDestino: TipoDestino;
    destinoId: string;
  }): Promise<RegistroBrutoDestino>;
  listarDestinos(registroBrutoId: string): Promise<RegistroBrutoDestino[]>;
}
