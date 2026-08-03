import type { ClienteRepository, FiltrosCliente } from "@/clientes/domain/cliente-repository";

export async function listarClientes(
  filtros: FiltrosCliente,
  deps: { clienteRepository: ClienteRepository }
) {
  return deps.clienteRepository.listar(filtros);
}
