import type { TipoDestino } from "@/shared/enums/tipo-destino";

export interface RegistroBrutoDestino {
  id: string;
  registroBrutoId: string;
  tipoDestino: TipoDestino;
  destinoId: string;
  createdAt: Date;
}
