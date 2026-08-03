import { listarLeads } from "@/pipeline_comercial/application/listar-leads";
import { criarDependenciasDoPipelineComercial } from "@/pipeline_comercial/infrastructure/composicao";
import {
  criarLeadAction,
  qualificarLeadAction,
  agendarComercialAction,
  marcarLeadComoReunidoAction,
} from "./actions";
import { converterLeadEmClienteAction } from "../clientes/actions";
import { SubmitButton } from "../_components/submit-button";

/**
 * Pipeline Comercial — Sprint 4.
 *
 * Fluxo: Lead → Qualificação → Agendamento (reaproveita Reuniões,
 * Sprint 3) → Reunido → Conversão em Cliente (árvore do Cap. 7.1,
 * SOM), aplicada aqui como formulário único guiado
 * (UI_UX.md, seção 7 — simplificação documentada no relatório).
 */
export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const deps = criarDependenciasDoPipelineComercial();
  const leads = await listarLeads({}, { leadRepository: deps.leadRepository });

  return (
    <div>
      <h1>Pipeline Comercial</h1>

      <section aria-labelledby="novo-lead">
        <h2 id="novo-lead">Novo Lead</h2>
        <form action={criarLeadAction}>
          <label>
            Nome
            <input type="text" name="nome" required />
          </label>
          <label>
            Origem
            <input type="text" name="origemLead" placeholder="indicação, inbound, prospecção..." />
          </label>
          <label>
            SDR responsável
            <input type="text" name="sdrResponsavel" />
          </label>
          <label>
            Temperatura
            <select name="temperatura" defaultValue="">
              <option value="">—</option>
              <option value="frio">Frio</option>
              <option value="morno">Morno</option>
              <option value="quente">Quente</option>
            </select>
          </label>
          <label>
            Ticket estimado
            <input type="number" name="ticketEstimado" step="0.01" />
          </label>
          <SubmitButton>Criar Lead</SubmitButton>
        </form>
      </section>

      <section aria-labelledby="leads">
        <h2 id="leads">Leads ({leads.length})</h2>
        {leads.length === 0 && <p>Nenhum lead ainda.</p>}
        <ul>
          {leads.map((lead) => (
            <li key={lead.id}>
              <p>
                <strong>{lead.nome}</strong> · {lead.origemLead ?? "origem não informada"} ·{" "}
                <em>{lead.statusComercial}</em>
                {lead.temperatura && ` · ${lead.temperatura}`}
              </p>

              {(lead.statusComercial === "novo" || lead.statusComercial === "qualificando") && (
                <form action={qualificarLeadAction}>
                  <input type="hidden" name="leadId" value={lead.id} />
                  <label>
                    Resumo da qualificação
                    <textarea name="resumoQualificacao" />
                  </label>
                  <label>
                    Objeções
                    <input type="text" name="objecoes" />
                  </label>
                  <label>
                    Próximo passo
                    <input type="text" name="proximoPasso" />
                  </label>
                  <SubmitButton>Registrar qualificação</SubmitButton>
                </form>
              )}

              {lead.statusComercial === "qualificado" && (
                <form action={agendarComercialAction}>
                  <input type="hidden" name="leadId" value={lead.id} />
                  <label>
                    Data e hora da reunião
                    <input type="datetime-local" name="dataHora" required />
                  </label>
                  <SubmitButton>Agendar (cria reunião na Agenda)</SubmitButton>
                </form>
              )}

              {lead.statusComercial === "agendado" && (
                <>
                  <p>
                    Reunião agendada — marque como realizada na{" "}
                    <a href="/agenda">Agenda</a> e depois confirme aqui.
                  </p>
                  <form action={marcarLeadComoReunidoAction}>
                    <input type="hidden" name="leadId" value={lead.id} />
                    <SubmitButton>Confirmar que a reunião aconteceu</SubmitButton>
                  </form>
                </>
              )}

              {lead.statusComercial === "reunido" && (
                <form action={converterLeadEmClienteAction}>
                  <input type="hidden" name="leadId" value={lead.id} />
                  <fieldset>
                    <legend>Árvore de decisão (SOM, Cap. 7.1)</legend>

                    <label>
                      Nome do cliente
                      <input type="text" name="nome" defaultValue={lead.nome} />
                    </label>
                    <label>
                      Setor
                      <input type="text" name="setor" />
                    </label>

                    <p>Este cliente tem autoridade/competência real no próprio setor?</p>
                    <label>
                      <input type="radio" name="temAutoridadeReal" value="sim" required /> Sim
                    </label>
                    <label>
                      <input type="radio" name="temAutoridadeReal" value="nao" /> Não
                    </label>

                    <p>Ele aceita ouvir diagnóstico antes de exigir execução imediata?</p>
                    <label>
                      <input type="radio" name="aceitaDiagnostico" value="sim" required /> Sim
                    </label>
                    <label>
                      <input type="radio" name="aceitaDiagnostico" value="nao" /> Não
                    </label>

                    <p>Existe sinal de não cumprimento de combinado (histórico/indicação)?</p>
                    <label>
                      <input type="radio" name="sinalNaoCumprimento" value="sim" required /> Sim
                    </label>
                    <label>
                      <input type="radio" name="sinalNaoCumprimento" value="nao" /> Não
                    </label>
                  </fieldset>
                  <SubmitButton>Converter em Cliente</SubmitButton>
                </form>
              )}

              {lead.statusComercial === "convertido_cliente" && (
                <p>
                  Convertido — ver detalhes em <a href="/clientes">Clientes</a>.
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
