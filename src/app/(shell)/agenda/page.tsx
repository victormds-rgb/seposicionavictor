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
import { SubmitButton } from "../_components/submit-button";

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
 * Agenda — Sprint 3.
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
      <h1>Agenda</h1>

      <section aria-labelledby="rotina-semanal">
        <h2 id="rotina-semanal">Rotina semanal fixa</h2>
        <form action={instanciarRotinaSemanalAction}>
          <input type="hidden" name="inicioDaSemana" value={inicio.toISOString()} />
          <SubmitButton>Criar rotina desta semana</SubmitButton>
        </form>
      </section>

      <section aria-labelledby="agendar-reuniao">
        <h2 id="agendar-reuniao">Agendar reunião</h2>
        <form action={agendarReuniaoAction}>
          <label>
            Data e hora
            <input type="datetime-local" name="dataHora" required />
          </label>
          <label>
            Local
            <input type="text" name="local" />
          </label>
          <label>
            Participantes (separados por vírgula)
            <input type="text" name="participantes" />
          </label>
          <SubmitButton>Agendar</SubmitButton>
        </form>
      </section>

      <section aria-labelledby="itens-semana">
        <h2 id="itens-semana">
          Semana de {inicio.toLocaleDateString("pt-BR")} a {fim.toLocaleDateString("pt-BR")}
        </h2>
        {itens.length === 0 && <p>Nenhum item de agenda nesta semana.</p>}
        <ul>
          {itens.map((item) => {
            const reuniaoAssociada = item.reuniaoId ? reuniaoPorId.get(item.reuniaoId) : null;
            return (
              <li key={item.id}>
                <p>
                  <strong>
                    {item.tipo === "rotina_fixa"
                      ? item.dataHora.toLocaleDateString("pt-BR")
                      : item.dataHora.toLocaleString("pt-BR")}
                  </strong>{" "}
                  · {descreverItemDeAgenda(item)} ·{" "}
                  <em>{ROTULOS_STATUS_ITEM[item.status] ?? item.status}</em>
                </p>

                {item.tipo === "rotina_fixa" && item.status === "agendado" && (
                  <form action={marcarItemComoConcluidoAction}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <SubmitButton>Marcar como concluído</SubmitButton>
                  </form>
                )}

                {reuniaoAssociada && (
                  <div>
                    <p>Reunião — status: {reuniaoAssociada.status}</p>

                    {reuniaoAssociada.status === "agendada" && (
                      <form action={marcarComoRealizadaAction}>
                        <input type="hidden" name="reuniaoId" value={reuniaoAssociada.id} />
                        <label>
                          Notas rápidas (opcional)
                          <textarea name="notasBrutas" />
                        </label>
                        <SubmitButton>Marcar como realizada</SubmitButton>
                      </form>
                    )}

                    {reuniaoAssociada.status === "realizada" && (
                      <>
                        <p>
                          Registre o que aconteceu na{" "}
                          <a href={`/inbox?reuniaoId=${reuniaoAssociada.id}`}>Inbox</a> para poder
                          processar esta reunião.
                        </p>
                        <form action={marcarComoProcessadaAction}>
                          <input type="hidden" name="reuniaoId" value={reuniaoAssociada.id} />
                          <SubmitButton>Marcar como processada</SubmitButton>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
