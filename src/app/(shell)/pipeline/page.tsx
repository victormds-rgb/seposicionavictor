import { listarLeads } from "@/pipeline_comercial/application/listar-leads";
import { criarDependenciasDoPipelineComercial } from "@/pipeline_comercial/infrastructure/composicao";
import {
  calcularScoreComercial,
  leadEstaParado,
  diasSemContato,
} from "@/pipeline_comercial/domain/inteligencia-comercial";
import { podeSerMarcadoComoPerdido, estaAtivo, CANAIS_ORIGEM_LEAD } from "@/pipeline_comercial/domain/lead";
import type { Lead } from "@/pipeline_comercial/domain/lead";
import {
  criarLeadAction,
  qualificarLeadAction,
  agendarComercialAction,
  marcarLeadComoReunidoAction,
  marcarLeadComoPerdidoAction,
  registrarContatoComLeadAction,
  definirProximoContatoAction,
} from "./actions";
import { converterLeadEmClienteAction } from "../clientes/actions";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { RadioGroup } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

/**
 * Pipeline Comercial — Sprint 4 (base), Sprint 42 (Fundação Comercial:
 * canal/campanha/interesse na captura, score/parado/próximo contato
 * na listagem, "marcar como perdido").
 *
 * A tela continua sendo uma lista (não um Kanban — fora de escopo da
 * Sprint 42, ver relatório da Sprint 41), mas agora responde às
 * perguntas que a Sprint 41 mapeou: estágio, temperatura, score, tempo
 * sem contato, próximo contato, se está parado, e qual ação falta.
 */
export const dynamic = "force-dynamic";

const ROTULOS_CANAL_ORIGEM: Record<(typeof CANAIS_ORIGEM_LEAD)[number], string> = {
  instagram: "Instagram",
  google: "Google",
  whatsapp: "WhatsApp",
  indicacao: "Indicação",
  organico: "Orgânico",
  prospeccao: "Prospecção",
  site: "Site",
  outro: "Outro",
};

// Mapeamento puro de apresentação — o Badge em si não sabe o que
// "reunido" significa, só recebe a variant já decidida aqui.
function variantDoStatus(status: string): "neutral" | "warning" | "danger" | "success" {
  if (status === "convertido_cliente") return "success";
  if (status === "perdido") return "danger";
  if (status === "agendado" || status === "reunido") return "warning";
  return "neutral";
}

function variantDaTemperatura(temperatura: string): "neutral" | "warning" | "danger" {
  if (temperatura === "quente") return "danger";
  if (temperatura === "morno") return "warning";
  return "neutral";
}

function variantDoScore(score: number): "neutral" | "warning" | "success" {
  if (score >= 60) return "success";
  if (score >= 30) return "warning";
  return "neutral";
}

// Sprint 33.5 (Refinamento): só "convertido_cliente" precisa de rótulo —
// os demais status já são uma única palavra legível ("novo",
// "qualificando" etc.).
function rotuloDoStatus(status: string): string {
  return status === "convertido_cliente" ? "Convertido em Cliente" : status;
}

type Filtro = "quentes" | "parados" | "follow_up_hoje";

function aplicarFiltro(leads: Lead[], filtro: Filtro | undefined, agora: Date): Lead[] {
  if (filtro === "quentes") return leads.filter((l) => estaAtivo(l) && l.temperatura === "quente");
  if (filtro === "parados") return leads.filter((l) => leadEstaParado(l, agora));
  if (filtro === "follow_up_hoje") {
    return leads.filter((l) => estaAtivo(l) && l.proximoContatoEm !== null && l.proximoContatoEm <= agora);
  }
  return leads;
}

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro } = await searchParams;
  const deps = criarDependenciasDoPipelineComercial();
  const agora = deps.clock.now();

  const todosOsLeads = await listarLeads({}, { leadRepository: deps.leadRepository });

  // Sinal usado no score ("qualificação já registrada?") — uma consulta
  // por lead (N+1 aceito nesta escala; ver relatório da Sprint 42).
  const temQualificacao = new Map<string, boolean>(
    await Promise.all(
      todosOsLeads.map(
        async (l) =>
          [l.id, (await deps.leadRepository.buscarQualificacaoMaisRecente(l.id)) !== null] as const
      )
    )
  );

  const scores = new Map<string, number | null>(
    todosOsLeads.map((l) => [
      l.id,
      calcularScoreComercial(l, { agora, temQualificacaoRegistrada: temQualificacao.get(l.id) ?? false }),
    ])
  );

  // Leads ativos primeiro, ordenados por score decrescente (quem
  // merece mais atenção agora aparece no topo — Sprint 41, seção D);
  // resolvidos (score null) ficam por último.
  const leads = aplicarFiltro(todosOsLeads, filtro as Filtro | undefined, agora).slice().sort((a, b) => {
    const scoreA = scores.get(a.id) ?? -1;
    const scoreB = scores.get(b.id) ?? -1;
    return scoreB - scoreA;
  });

  return (
    <div>
      <PageHeader title="Pipeline Comercial" />

      {filtro && (
        <p className="mb-4 text-sm text-zinc-500">
          Filtro ativo: <strong>{filtro.replace("_", " ")}</strong> —{" "}
          <a href="/pipeline" className="underline">
            limpar filtro
          </a>
        </p>
      )}

      <div className="space-y-4">
        <Section title="Novo Lead">
          <form action={criarLeadAction} className="max-w-md space-y-4">
            <FormField label="Nome">
              <Input type="text" name="nome" required />
            </FormField>
            <SelectField label="Canal de origem" name="canalOrigem" defaultValue="">
              <option value="">—</option>
              {CANAIS_ORIGEM_LEAD.map((canal) => (
                <option key={canal} value={canal}>
                  {ROTULOS_CANAL_ORIGEM[canal]}
                </option>
              ))}
            </SelectField>
            <FormField label="Origem (detalhe)">
              <Input type="text" name="origemLead" placeholder="indicação de fulano, campanha X..." />
            </FormField>
            <FormField label="Campanha">
              <Input type="text" name="campanha" placeholder="opcional" />
            </FormField>
            <FormField label="O que ele precisa (interesse)">
              <Input type="text" name="interesse" placeholder="opcional" />
            </FormField>
            <FormField label="SDR responsável">
              <Input type="text" name="sdrResponsavel" />
            </FormField>
            <SelectField label="Temperatura" name="temperatura" defaultValue="">
              <option value="">—</option>
              <option value="frio">Frio</option>
              <option value="morno">Morno</option>
              <option value="quente">Quente</option>
            </SelectField>
            <FormField label="Ticket estimado">
              <Input type="number" name="ticketEstimado" step="0.01" />
            </FormField>
            <Button type="submit">Criar Lead</Button>
          </form>
        </Section>

        <Section title={`Leads (${leads.length})`}>
          {leads.length === 0 && <EmptyState message="Nenhum lead ainda." />}
          <ul className="space-y-4">
            {leads.map((lead) => {
              const score = scores.get(lead.id) ?? null;
              const parado = leadEstaParado(lead, agora);
              const dias = Math.floor(diasSemContato(lead, agora));

              return (
                <li key={lead.id} className="border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-900">
                    <strong className="font-medium">{lead.nome}</strong>
                    <span className="text-zinc-500">
                      {lead.canalOrigem ? ROTULOS_CANAL_ORIGEM[lead.canalOrigem] : "canal não informado"}
                    </span>
                    <Badge variant={variantDoStatus(lead.statusComercial)}>
                      {rotuloDoStatus(lead.statusComercial)}
                    </Badge>
                    {lead.temperatura && (
                      <Badge variant={variantDaTemperatura(lead.temperatura)}>{lead.temperatura}</Badge>
                    )}
                    {score !== null && <Badge variant={variantDoScore(score)}>Score {score}</Badge>}
                    {parado && <Badge variant="warning">Parado há {dias}d</Badge>}
                  </p>

                  {estaAtivo(lead) && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {lead.ultimoContatoEm
                        ? `Último contato: ${lead.ultimoContatoEm.toLocaleDateString("pt-BR")}`
                        : "Ainda sem contato registrado"}
                      {" · "}
                      {lead.proximoContatoEm
                        ? `Próximo contato: ${lead.proximoContatoEm.toLocaleDateString("pt-BR")}`
                        : "Sem próximo contato definido"}
                    </p>
                  )}

                  {lead.motivoPerda && (
                    <p className="mt-1 text-xs text-zinc-500">Motivo da perda: {lead.motivoPerda}</p>
                  )}

                  {(lead.statusComercial === "novo" || lead.statusComercial === "qualificando") && (
                    <form action={qualificarLeadAction} className="mt-3 max-w-md space-y-4">
                      <input type="hidden" name="leadId" value={lead.id} />
                      <TextareaField label="Resumo da qualificação" name="resumoQualificacao" />
                      <FormField label="Objeções">
                        <Input type="text" name="objecoes" />
                      </FormField>
                      <FormField label="Próximo passo">
                        <Input type="text" name="proximoPasso" />
                      </FormField>
                      <Button type="submit">Registrar qualificação</Button>
                    </form>
                  )}

                  {lead.statusComercial === "qualificado" && (
                    <form action={agendarComercialAction} className="mt-3 max-w-md space-y-4">
                      <input type="hidden" name="leadId" value={lead.id} />
                      <FormField label="Data e hora da reunião">
                        <Input type="datetime-local" name="dataHora" required />
                      </FormField>
                      <Button type="submit">Agendar (cria reunião na Agenda)</Button>
                    </form>
                  )}

                  {lead.statusComercial === "agendado" && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-zinc-600">
                        Reunião agendada — marque como realizada na{" "}
                        <a href="/agenda" className="text-zinc-900 underline">
                          Agenda
                        </a>{" "}
                        e depois confirme aqui.
                      </p>
                      <form action={marcarLeadComoReunidoAction}>
                        <input type="hidden" name="leadId" value={lead.id} />
                        <Button type="submit" variant="secondary">
                          Confirmar que a reunião aconteceu
                        </Button>
                      </form>
                    </div>
                  )}

                  {lead.statusComercial === "reunido" && (
                    <form action={converterLeadEmClienteAction} className="mt-3 max-w-md space-y-4">
                      <input type="hidden" name="leadId" value={lead.id} />
                      <fieldset className="space-y-4">
                        <legend className="text-sm font-semibold text-zinc-900">
                          Árvore de decisão (SOM, Cap. 7.1)
                        </legend>

                        <FormField label="Nome do cliente">
                          <Input type="text" name="nome" defaultValue={lead.nome} />
                        </FormField>
                        <FormField label="Setor">
                          <Input type="text" name="setor" />
                        </FormField>

                        <RadioGroup
                          legend="Este cliente tem autoridade/competência real no próprio setor?"
                          name="temAutoridadeReal"
                          required
                          options={[
                            { value: "sim", label: "Sim" },
                            { value: "nao", label: "Não" },
                          ]}
                        />
                        <RadioGroup
                          legend="Ele aceita ouvir diagnóstico antes de exigir execução imediata?"
                          name="aceitaDiagnostico"
                          required
                          options={[
                            { value: "sim", label: "Sim" },
                            { value: "nao", label: "Não" },
                          ]}
                        />
                        <RadioGroup
                          legend="Existe sinal de não cumprimento de combinado (histórico/indicação)?"
                          name="sinalNaoCumprimento"
                          required
                          options={[
                            { value: "sim", label: "Sim" },
                            { value: "nao", label: "Não" },
                          ]}
                        />
                      </fieldset>
                      <Button type="submit">Converter em Cliente</Button>
                    </form>
                  )}

                  {lead.statusComercial === "convertido_cliente" && (
                    <p className="mt-2 text-sm text-zinc-600">
                      Convertido — ver detalhes em{" "}
                      <a href="/clientes" className="text-zinc-900 underline">
                        Clientes
                      </a>
                      .
                    </p>
                  )}

                  {estaAtivo(lead) && (
                    <div className="mt-3 flex flex-wrap gap-4">
                      <form action={registrarContatoComLeadAction}>
                        <input type="hidden" name="leadId" value={lead.id} />
                        <Button type="submit" variant="secondary">
                          Registrar contato agora
                        </Button>
                      </form>

                      <form action={definirProximoContatoAction} className="flex items-end gap-2">
                        <input type="hidden" name="leadId" value={lead.id} />
                        <FormField label="Próximo contato">
                          <Input type="date" name="proximoContatoEm" required />
                        </FormField>
                        <Button type="submit" variant="secondary">
                          Definir
                        </Button>
                      </form>
                    </div>
                  )}

                  {podeSerMarcadoComoPerdido(lead) && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-zinc-500">Marcar como perdido</summary>
                      <form action={marcarLeadComoPerdidoAction} className="mt-2 max-w-md space-y-4">
                        <input type="hidden" name="leadId" value={lead.id} />
                        <TextareaField label="Motivo da perda" name="motivoPerda" required />
                        <Button type="submit" variant="secondary">
                          Confirmar perda
                        </Button>
                      </form>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      </div>
    </div>
  );
}
