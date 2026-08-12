import { listarAlertas, listarAuditorias } from "@/notificacoes/application/gestao-de-alertas";
import { criarDependenciasDeNotificacoes } from "@/notificacoes/infrastructure/composicao";
import { reconhecerAlertaAction, resolverAlertaAction, executarAuditoriaAction } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

/**
 * Alertas — Sprint 9 (INFORMATION_ARCHITECTURE.md, seção 9; acessada
 * a partir do Dashboard, não é item da Navegação Global), redesenhada
 * na Sprint de UX/UI para não destoar visualmente do resto do produto.
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
  lead_parado: "Lead parado",
};

function variantDoStatusAlerta(status: string): "neutral" | "warning" | "success" {
  if (status === "resolvido") return "success";
  if (status === "reconhecido") return "warning";
  return "neutral";
}

export default async function AlertasPage() {
  const deps = criarDependenciasDeNotificacoes();
  const alertas = await listarAlertas({}, { alertaRepository: deps.alertaRepository });
  const auditorias = await listarAuditorias({ auditoriaDeDriftRepository: deps.auditoriaDeDriftRepository });

  return (
    <div>
      <PageHeader title="Alertas" description="Tudo que o FDE detectou automaticamente e precisa da sua atenção." />

      <div className="space-y-6">
        <Section title={`Alertas (${alertas.length})`}>
          {alertas.length === 0 && <EmptyState message="Nenhum alerta registrado." />}
          <ul className="space-y-3">
            {alertas.map((a) => (
              <li key={a.id}>
                <Card className="p-4 shadow-none">
                  <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-900">
                    <Badge variant="danger">{ROTULOS_TIPO_ALERTA[a.tipo] ?? a.tipo}</Badge>
                    <Badge variant={variantDoStatusAlerta(a.status)}>{a.status}</Badge>
                  </p>
                  <p className="mt-2 text-sm text-zinc-700">{a.condicaoGatilho}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.status === "ativo" && (
                      <form action={reconhecerAlertaAction}>
                        <input type="hidden" name="alertaId" value={a.id} />
                        <Button type="submit" variant="secondary">
                          Reconhecer
                        </Button>
                      </form>
                    )}
                    {a.tipo !== "build_log_ausente" && a.status !== "resolvido" && (
                      <form action={resolverAlertaAction}>
                        <input type="hidden" name="alertaId" value={a.id} />
                        <Button type="submit">Resolver</Button>
                      </form>
                    )}
                  </div>

                  {a.tipo === "build_log_ausente" && a.status !== "resolvido" && (
                    <p className="mt-2 text-xs text-zinc-500">
                      Só resolvido pela publicação de um novo Build Log — ver{" "}
                      <a href="/projetos" className="underline">
                        Projetos
                      </a>
                      .
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Auditoria de Drift (SOM Cap. 8.2)">
          <form action={executarAuditoriaAction} className="mb-4">
            <Button type="submit" variant="secondary">
              Executar auditoria agora
            </Button>
          </form>
          {auditorias.length === 0 ? (
            <EmptyState message="Nenhuma auditoria executada ainda." />
          ) : (
            <ul className="space-y-2 text-sm text-zinc-700">
              {auditorias.map((auditoria) => (
                <li key={auditoria.id} className="border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
                  {auditoria.dataExecucao.toLocaleString("pt-BR")} · {auditoria.pecasAvaliadas.length}{" "}
                  peças avaliadas · falha: {auditoria.percentualFalha ?? "—"}%
                  {auditoria.recomendacaoGerada && (
                    <p className="mt-1 text-xs text-zinc-500">{auditoria.recomendacaoGerada}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
