import { DrizzleClienteRepository } from "@/clientes/infrastructure/cliente-repository";
import { DrizzleLeadRepository } from "@/pipeline_comercial/infrastructure/lead-repository";
import { criarEventDispatcher } from "@/event_log/infrastructure/composicao";

export function criarDependenciasDeClientes() {
  return {
    clienteRepository: new DrizzleClienteRepository(),
    leadRepository: new DrizzleLeadRepository(),
    eventPublisher: criarEventDispatcher(),
  };
}
