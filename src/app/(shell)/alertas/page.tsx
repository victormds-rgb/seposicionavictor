import { listarAlertas, listarAuditorias } from "@/notificacoes/application/gestao-de-alertas";
import { criarDependenciasDeNotificacoes } from "@/notificacoes/infrastructure/composicao";
import { reconhecerAlertaAction, resolverAlertaAction, executarAuditoriaAction } from "./actions";
import { SubmitButton } from "../_components/submit-button";

/**
 * Alertas — Sprint 9 (INFORMATION_ARCHITECTURE.md, seção 9; acessada
 * a partir do Dashboard, não é item da Navegação Global).
 */
export const dynamic = "force-dynamic";

// Sprint 33.5 (Refinamento): rótulo legível para o tipo do Alerta —
// antes aparecia cru ("drift_critico", "desvio_pilares"). Mesmo
// mapeamento usado na seção "Alertas ativos" do Dashboard.
const ROTULOS_TIPO_ALERTA: Record<string, string> = {
  build_log_ausente: "Build Log ausente",
  auditoria_devida: "Auditoria devida",
  desvio_pilares: "Desvio de pilares",
  drift_critico: "Drift crítico",
};

export default async function AlertasPage() {
  const deps = criarDependenciasDeNotificacoes();
  const alertas = await listarAlertas({}, { alertaRepository: deps.alertaRepository });
  const auditorias = await listarAuditorias({ auditoriaDeDriftRepository: deps.auditoriaDeDriftRepository });

  return (
    <div>
      <h1>Alertas</h1>

      <section aria-labelledby="lista-alertas">
        <h2 id="lista-alertas">Alertas ({alertas.length})</h2>
        {alertas.length === 0 && <p>Nenhum alerta registrado.</p>}
        <ul>
          {alertas.map((a) => (
            <li key={a.id}>
              <p>
                <strong>{ROTULOS_TIPO_ALERTA[a.tipo] ?? a.tipo}</strong> · <em>{a.status}</em>
              </p>
              <p>{a.condicaoGatilho}</p>
              {a.status === "ativo" && (
                <form action={reconhecerAlertaAction}>
                  <input type="hidden" name="alertaId" value={a.id} />
                  <SubmitButton>Reconhecer</SubmitButton>
                </form>
              )}
              {a.tipo !== "build_log_ausente" && a.status !== "resolvido" && (
                <form action={resolverAlertaAction}>
                  <input type="hidden" name="alertaId" value={a.id} />
                  <SubmitButton>Resolver</SubmitButton>
                </form>
              )}
              {a.tipo === "build_log_ausente" && a.status !== "resolvido" && (
                <p>
                  <em>Só resolvido pela publicação de um novo Build Log — ver <a href="/projetos">Projetos</a>.</em>
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="auditoria-drift">
        <h2 id="auditoria-drift">Auditoria de Drift (SOM Cap. 8.2)</h2>
        <form action={executarAuditoriaAction}>
          <SubmitButton>Executar auditoria agora</SubmitButton>
        </form>
        <ul>
          {auditorias.map((auditoria) => (
            <li key={auditoria.id}>
              {auditoria.dataExecucao.toLocaleString("pt-BR")} · {auditoria.pecasAvaliadas.length}{" "}
              peças avaliadas · falha: {auditoria.percentualFalha ?? "—"}%
              {auditoria.recomendacaoGerada && <p>{auditoria.recomendacaoGerada}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
