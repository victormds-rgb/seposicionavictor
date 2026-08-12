import { listarItensAgenda } from "@/agenda/application/listar-itens-agenda";
import { listarReunioes } from "@/reunioes/application/listar-reunioes";
import { criarDependenciasDaAgenda } from "@/agenda/infrastructure/composicao";
import { ROTINA_SEMANAL_FIXA } from "@/agenda/domain/item-agenda";
import {
  agendarReuniaoAction,
  marcarComoRealizadaAction,
  marcarComoProcessadaAction,
  marcarItemComoConcluidoAction,
  instanciarRotinaSemanalAction,
} from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { TextareaField } from "@/components/ui/textarea-field";
import { Button } from "@/components/ui/button";

// Sprint 33.5 (Refinamento): mesma lógica de descrição já usada no
// Dashboard (Sprint 23) — sem isto, a própria tela de Agenda (o lugar
// dedicado a ver a agenda) mostrava só "rotina_fixa
// (segunda_desculpa_semana)" cru, enquanto o Dashboard já mostrava a
// descrição legível para o mesmo dado.
function descreverItemDeAgenda(item: { tipo: string; rotinaFixaReferencia: string | null }): string {
  if (item.tipo === "rotina_fixa" && item.rotinaFixaReferencia) {
    const rotina = ROTINA_SEMANAL_FIXA.find((r) => r.referencia === item.rotinaFixaReferencia);
    if (rotina) return rotina.descricao;
  }
  return item.tipo === "tarefa_com_prazo" ? "Tarefa com prazo" : "Reunião";
}

function variantDoStatusItem(status: string): "neutral" | "warning" | "success" | "danger" {
  if (status === "concluido") return "success";
  if (status === "perdido") return "danger";
  return "neutral";
}

const ROTULOS_STATUS_ITEM: Record<string, string> = {
  agendado: "Agendado",
  concluido: "Concluído",
  perdido: "Perdido",
};

function inicioDaSemanaAtual(): Date {
  const agora = new Date();
  const diaSemana = agora.getDay(); // 0 = domingo
  const offset = diaSemana === 0 ? -6 : 1 - diaSemana; // volta para segunda-feira
  const segunda = new Date(agora);
  segunda.setDate(agora.getDate() + offset);
  segunda.setHours(0, 0, 0, 0);
  return segunda;
}

/**
 * Agenda — Sprint 3, redesenhada na Sprint de UX/UI (Fase 12 — a tela
 * era HTML cru).
 *
 * Visão semanal padrão (UI_UX.md, seção 8), reunindo reuniões e a
 * rotina semanal fixa (SOM Cap. 9.4).
 *
 * Apenas consulta dados — a verificação de itens vencidos roda como
 * Job do Scheduler (`infra/scheduler/jobs/atualizar-itens-vencidos-job.ts`),
 * não durante a renderização (Hardening, ARCHITECTURE.md, seção 12).
 */
export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const deps = criarDependenciasDaAgenda();
  const inicio = inicioDaSemanaAtual();
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  fim.setHours(23, 59, 59, 999);

  const itens = await listarItensAgenda(
    { de: inicio, ate: fim },
    { itemDeAgendaRepository: deps.itemDeAgendaRepository }
  );

  const reunioes = await listarReunioes({}, { reuniaoRepository: deps.reuniaoRepository });
  const reuniaoPorId = new Map(reunioes.map((r) => [r.id, r]));

  return (
    <div>
      <PageHeader
        title="Agenda"
        description={`Semana de ${inicio.toLocaleDateString("pt-BR")} a ${fim.toLocaleDateString("pt-BR")}.`}
      />

      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Section title="Rotina semanal fixa">
            <p className="mb-3 text-sm text-zinc-500">
              Cria os itens fixos da semana (desculpas, auditorias etc.) de uma vez.
            </p>
            <form action={instanciarRotinaSemanalAction}>
              <input type="hidden" name="inicioDaSemana" value={inicio.toISOString()} />
              <Button type="submit" variant="secondary">
                Criar rotina desta semana
              </Button>
            </form>
          </Section>

          <Section title="Agendar reunião">
            <form action={agendarReuniaoAction} className="space-y-4">
              <FormField label="Data e hora">
                <Input type="datetime-local" name="dataHora" required />
              </FormField>
              <FormField label="Local" help="opcional">
                <Input type="text" name="local" />
              </FormField>
              <FormField label="Participantes" help="separados por vírgula, opcional">
                <Input type="text" name="participantes" />
              </FormField>
              <Button type="submit">Agendar</Button>
            </form>
          </Section>
        </div>

        <Section title={`Itens da semana (${itens.length})`}>
          {itens.length === 0 && <EmptyState message="Nenhum item de agenda nesta semana." />}
          <ul className="space-y-3">
            {itens.map((item) => {
              const reuniaoAssociada = item.reuniaoId ? reuniaoPorId.get(item.reuniaoId) : null;
              return (
                <li key={item.id}>
                  <Card className="p-4 shadow-none">
                    <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-900">
                      <strong className="font-medium">
                        {item.tipo === "rotina_fixa"
                          ? item.dataHora.toLocaleDateString("pt-BR")
                          : item.dataHora.toLocaleString("pt-BR")}
                      </strong>
                      <span className="text-zinc-500">{descreverItemDeAgenda(item)}</span>
                      <Badge variant={variantDoStatusItem(item.status)}>
                        {ROTULOS_STATUS_ITEM[item.status] ?? item.status}
                      </Badge>
                    </p>

                    {item.tipo === "rotina_fixa" && item.status === "agendado" && (
                      <form action={marcarItemComoConcluidoAction} className="mt-3">
                        <input type="hidden" name="itemId" value={item.id} />
                        <Button type="submit" variant="secondary">
                          Marcar como concluído
                        </Button>
                      </form>
                    )}

                    {reuniaoAssociada && (
                      <div className="mt-3 border-t border-zinc-100 pt-3">
                        <p className="text-xs text-zinc-500">
                          Reunião — status: <strong className="text-zinc-700">{reuniaoAssociada.status}</strong>
                        </p>

                        {reuniaoAssociada.status === "agendada" && (
                          <form action={marcarComoRealizadaAction} className="mt-2 max-w-md space-y-4">
                            <input type="hidden" name="reuniaoId" value={reuniaoAssociada.id} />
                            <TextareaField label="Notas rápidas" name="notasBrutas" help="opcional" />
                            <Button type="submit">Marcar como realizada</Button>
                          </form>
                        )}

                        {reuniaoAssociada.status === "realizada" && (
                          <div className="mt-2 space-y-2">
                            <p className="text-sm text-zinc-600">
                              Registre o que aconteceu na{" "}
                              <a
                                href={`/inbox?reuniaoId=${reuniaoAssociada.id}`}
                                className="text-zinc-900 underline"
                              >
                                Inbox
                              </a>{" "}
                              para poder processar esta reunião.
                            </p>
                            <form action={marcarComoProcessadaAction}>
                              <input type="hidden" name="reuniaoId" value={reuniaoAssociada.id} />
                              <Button type="submit" variant="secondary">
                                Marcar como processada
                              </Button>
                            </form>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        </Section>
      </div>
    </div>
  );
}
