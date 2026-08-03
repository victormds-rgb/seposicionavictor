import type {
  AlertaRepository,
  FiltrosAlerta,
  AuditoriaDeDriftRepository,
} from "@/notificacoes/domain/notificacoes-repository";
import { podeSerReconhecido, podeSerResolvidoManualmente } from "@/notificacoes/domain/alerta";

export class AlertaNaoEncontradoError extends Error {}
export class TransicaoInvalidaError extends Error {}

export async function reconhecerAlerta(alertaId: string, deps: { alertaRepository: AlertaRepository }) {
  const alerta = await deps.alertaRepository.buscarPorId(alertaId);
  if (!alerta) throw new AlertaNaoEncontradoError(`Alerta ${alertaId} não encontrado.`);
  if (!podeSerReconhecido(alerta)) {
    throw new TransicaoInvalidaError(`Alerta ${alertaId} não pode ser reconhecido no status atual.`);
  }
  await deps.alertaRepository.atualizarStatus(alertaId, "reconhecido");
}

/**
 * Invariante (DOMAIN_MODEL.md): `build_log_ausente` nunca é resolvido
 * manualmente — apenas pela publicação de um novo Build Log
 * (verificado automaticamente na próxima execução do
 * MonitorDeConsistencia, que não recria o alerta se a condição já
 * não existir mais — ver `garantirAlertaAtivo`).
 */
export async function resolverAlerta(alertaId: string, deps: { alertaRepository: AlertaRepository }) {
  const alerta = await deps.alertaRepository.buscarPorId(alertaId);
  if (!alerta) throw new AlertaNaoEncontradoError(`Alerta ${alertaId} não encontrado.`);
  if (!podeSerResolvidoManualmente(alerta)) {
    throw new TransicaoInvalidaError(
      `Alerta ${alertaId} (tipo ${alerta.tipo}) não pode ser resolvido manualmente.`
    );
  }
  await deps.alertaRepository.atualizarStatus(alertaId, "resolvido", new Date());
}

export async function listarAlertas(filtros: FiltrosAlerta, deps: { alertaRepository: AlertaRepository }) {
  return deps.alertaRepository.listar(filtros);
}

export async function listarAuditorias(deps: {
  auditoriaDeDriftRepository: AuditoriaDeDriftRepository;
}) {
  return deps.auditoriaDeDriftRepository.listar({});
}
