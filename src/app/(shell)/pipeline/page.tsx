import { listarLeads } from "@/pipeline_comercial/application/listar-leads";
import { criarDependenciasDoPipelineComercial } from "@/pipeline_comercial/infrastructure/composicao";
import {
  criarLeadAction,
  qualificarLeadAction,
  agendarComercialAction,
  marcarLeadComoReunidoAction,
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
 * Pipeline Comercial — Sprint 4, estilo Sprint 27 (Form Design
 * System: SelectField/TextareaField/RadioGroup).
 *
 * Fluxo: Lead → Qualificação → Agendamento (reaproveita Reuniões,
 * Sprint 3) → Reunido → Conversão em Cliente (árvore do Cap. 7.1,
 * SOM), aplicada aqui como formulário único guiado
 * (UI_UX.md, seção 7 — simplificação documentada no relatório).
 */
export const dynamic = "force-dynamic";

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

// Sprint 33.5 (Refinamento): só "convertido_cliente" precisa de rótulo —
// os demais status já são uma única palavra legível ("novo",
// "qualificando" etc.).
function rotuloDoStatus(status: string): string {
  return status === "convertido_cliente" ? "Convertido em Cliente" : status;
}

export default async function PipelinePage() {
  const deps = criarDependenciasDoPipelineComercial();
  const leads = await listarLeads({}, { leadRepository: deps.leadRepository });

  return (
    <div>
      <PageHeader title="Pipeline Comercial" />

      <div className="space-y-4">
        <Section title="Novo Lead">
          <form action={criarLeadAction} className="max-w-md space-y-4">
            <FormField label="Nome">
              <Input type="text" name="nome" required />
            </FormField>
            <FormField label="Origem">
              <Input type="text" name="origemLead" placeholder="indicação, inbound, prospecção..." />
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
            {leads.map((lead) => (
              <li key={lead.id} className="border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
                <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-900">
                  <strong className="font-medium">{lead.nome}</strong>
                  <span className="text-zinc-500">{lead.origemLead ?? "origem não informada"}</span>
                  <Badge variant={variantDoStatus(lead.statusComercial)}>
                    {rotuloDoStatus(lead.statusComercial)}
                  </Badge>
                  {lead.temperatura && (
                    <Badge variant={variantDaTemperatura(lead.temperatura)}>{lead.temperatura}</Badge>
                  )}
                </p>

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
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
