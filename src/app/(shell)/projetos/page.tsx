import { listarProjetos } from "@/projetos/application/listar-e-encerrar-projeto";
import { listarCasesDoProjeto } from "@/cases/application/publicar-case";
import { listarBuildLogsDoProjeto } from "@/build_logs/application/build-log-use-cases";
import { listarClientes } from "@/clientes/application/listar-clientes";
import { criarDependenciasDeProjetos } from "@/projetos/infrastructure/composicao";
import { camposDeCaseCompletos } from "@/projetos/domain/projeto";
import {
  criarProjetoAction,
  atualizarCamposDeCaseAction,
  criarCriterioAction,
  satisfazerCriterioAction,
  encerrarProjetoAction,
  criarCaseAction,
  atualizarCaseAction,
  publicarCaseAction,
  criarBuildLogAction,
  atualizarBuildLogAction,
  publicarBuildLogAction,
} from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

/**
 * Projetos — Sprint 5, estilo Sprint 28 (Design System já existente,
 * sem componentes novos).
 *
 * Case e Build Log aparecem como abas dentro do Projeto
 * (INFORMATION_ARCHITECTURE.md, seção 5 — nunca navegados
 * isoladamente sem o contexto do Projeto de origem).
 */
export const dynamic = "force-dynamic";

// Mapeamentos puros de apresentação — mesmo padrão do Pipeline/Clientes:
// o Badge não sabe o que os status significam, só recebe a variant.
function variantDoStatusProjeto(status: string): "neutral" | "warning" | "success" {
  if (status === "pronto_para_case") return "warning";
  return "neutral";
}

// Sprint 33.5 (Refinamento): rótulos legíveis — antes apareciam crus
// ("cliente_externo", "pronto_para_case", "em_andamento").
const ROTULOS_TIPO_PROJETO: Record<string, string> = {
  cliente_externo: "Cliente Externo",
  produto_proprio: "Produto Próprio",
};

const ROTULOS_STATUS_PROJETO: Record<string, string> = {
  em_andamento: "Em andamento",
  pronto_para_case: "Pronto para Case",
};

function variantDoStatusCase(status: string): "neutral" | "warning" | "success" {
  if (status === "publicado") return "success";
  if (status === "completo") return "warning";
  return "neutral";
}

function variantDoStatusBuildLog(status: string): "neutral" | "success" {
  return status === "publicado" ? "success" : "neutral";
}

export default async function ProjetosPage() {
  const deps = criarDependenciasDeProjetos();
  const projetos = await listarProjetos({}, { projetoRepository: deps.projetoRepository });
  // Sprint 33.5 (Refinamento): lista de Clientes para o select abaixo —
  // antes o campo pedia o uuid colado manualmente (fonte: a linha "ID
  // (para criar Projeto)" na tela de Clientes). Elimina o copiar/colar
  // e o risco de colar um id errado.
  const clientes = await listarClientes({}, { clienteRepository: deps.clienteRepository });

  return (
    <div>
      <PageHeader title="Projetos" />

      <div className="space-y-4">
        <Section title="Novo Projeto">
          <form action={criarProjetoAction} className="max-w-md space-y-4">
            <FormField label="Nome">
              <Input type="text" name="nome" required />
            </FormField>
            <SelectField label="Tipo" name="tipo" defaultValue="cliente_externo">
              <option value="cliente_externo">Cliente externo</option>
              <option value="produto_proprio">Produto próprio</option>
            </SelectField>
            <SelectField label="Cliente (obrigatório se cliente externo)" name="clienteId" defaultValue="">
              <option value="">—</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </SelectField>
            <TextareaField label="Desculpa inicial (obrigatório se cliente externo)" name="desculpaInicial" />
            <FormField label="Custo mensal (obrigatório se cliente externo)">
              <Input type="number" name="custoMensal" step="0.01" />
            </FormField>
            <Button type="submit">Criar Projeto</Button>
          </form>
        </Section>

        <Section title={`Projetos (${projetos.length})`}>
          {projetos.length === 0 && <EmptyState message="Nenhum projeto ainda." />}
          <ul className="space-y-4">
            {await Promise.all(
              projetos.map(async (projeto) => {
                const cases = await listarCasesDoProjeto(projeto.id, {
                  caseRepository: deps.caseRepository,
                });
                const buildLogs = await listarBuildLogsDoProjeto(projeto.id, {
                  buildLogRepository: deps.buildLogRepository,
                });
                const camposCompletos = camposDeCaseCompletos(projeto);
                // Sprint 23B, item 1: nome do Cliente na listagem —
                // clienteId já existia, só faltava o lookup para exibição.
                const cliente =
                  projeto.tipo === "cliente_externo" && projeto.clienteId
                    ? await deps.clienteRepository.buscarPorId(projeto.clienteId)
                    : null;

                return (
                  <li key={projeto.id} className="border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-900">
                      <strong className="font-medium">{projeto.nome}</strong>
                      <span className="text-zinc-500">{ROTULOS_TIPO_PROJETO[projeto.tipo] ?? projeto.tipo}</span>
                      <Badge variant={variantDoStatusProjeto(projeto.status)}>
                        {ROTULOS_STATUS_PROJETO[projeto.status] ?? projeto.status}
                      </Badge>
                      {cliente && <span className="text-zinc-500">Cliente: {cliente.nome}</span>}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Progresso dos 6 campos de case: {camposCompletos ? "completo" : "em preenchimento"}
                    </p>

                    {projeto.status !== "encerrado" && projeto.status !== "pronto_para_case" && (
                      <form action={atualizarCamposDeCaseAction} className="mt-3 max-w-md space-y-4">
                        <input type="hidden" name="projetoId" value={projeto.id} />
                        <FormField label="Momento da quebra">
                          <Input type="text" name="momentoQuebra" defaultValue={projeto.momentoQuebra ?? ""} />
                        </FormField>
                        <FormField label="Solução">
                          <Input type="text" name="solucao" defaultValue={projeto.solucao ?? ""} />
                        </FormField>
                        <FormField label="Tempo">
                          <Input type="text" name="tempoDecorrido" defaultValue={projeto.tempoDecorrido ?? ""} />
                        </FormField>
                        <FormField label="Número (resultado)">
                          <Input type="text" name="numeroResultado" defaultValue={projeto.numeroResultado ?? ""} />
                        </FormField>
                        <Button type="submit">Atualizar campos de case</Button>
                      </form>
                    )}

                    {projeto.status === "pronto_para_case" && cases.length === 0 && (
                      <form action={criarCaseAction} className="mt-3">
                        <input type="hidden" name="projetoId" value={projeto.id} />
                        <Button type="submit">Criar Case a partir deste Projeto</Button>
                      </form>
                    )}

                    {projeto.tipo === "produto_proprio" && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-zinc-700">
                          Critérios de Lançamento
                        </summary>
                        <div className="mt-3 space-y-3">
                          {(await deps.projetoRepository.listarCriteriosDeLancamento(projeto.id)).map(
                            (criterio) => (
                              <div key={criterio.id} className="text-sm text-zinc-700">
                                <p>
                                  {criterio.descricaoFeature} — <em>{criterio.status}</em>
                                </p>
                                {criterio.status === "pendente" && (
                                  <form action={satisfazerCriterioAction} className="mt-1">
                                    <input type="hidden" name="criterioId" value={criterio.id} />
                                    <Button type="submit" variant="secondary">
                                      Satisfazer (&quot;ficou muito bom, vai me ajudar&quot;)
                                    </Button>
                                  </form>
                                )}
                              </div>
                            )
                          )}
                          <form action={criarCriterioAction} className="flex max-w-md gap-2">
                            <input type="hidden" name="projetoId" value={projeto.id} />
                            <Input
                              type="text"
                              name="descricaoFeature"
                              placeholder="Descrição da feature"
                              required
                            />
                            <Button type="submit">Adicionar</Button>
                          </form>
                        </div>
                      </details>
                    )}

                    {projeto.status !== "encerrado" && (
                      <form action={encerrarProjetoAction} className="mt-3">
                        <input type="hidden" name="projetoId" value={projeto.id} />
                        <Button type="submit" variant="secondary">
                          Encerrar Projeto
                        </Button>
                      </form>
                    )}

                    {cases.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-zinc-900">Case</h3>
                        {cases.map((caso) => (
                          <div key={caso.id} className="mt-2 space-y-2">
                            <Badge variant={variantDoStatusCase(caso.status)}>{caso.status}</Badge>
                            <form action={atualizarCaseAction} className="max-w-md space-y-2">
                              <input type="hidden" name="caseId" value={caso.id} />
                              <Input type="text" name="desculpa" defaultValue={caso.desculpa ?? ""} placeholder="Desculpa" />
                              <Input type="number" name="custo" step="0.01" defaultValue={caso.custo ?? ""} placeholder="Custo" />
                              <Input type="text" name="momentoQuebra" defaultValue={caso.momentoQuebra ?? ""} placeholder="Momento da quebra" />
                              <Input type="text" name="solucao" defaultValue={caso.solucao ?? ""} placeholder="Solução" />
                              <Input type="text" name="tempo" defaultValue={caso.tempo ?? ""} placeholder="Tempo" />
                              <Input type="text" name="numeroResultado" defaultValue={caso.numeroResultado ?? ""} placeholder="Número" />
                              <Button type="submit">Salvar edição (gera histórico)</Button>
                            </form>
                            {caso.status === "completo" && (
                              <form action={publicarCaseAction}>
                                <input type="hidden" name="caseId" value={caso.id} />
                                <Button type="submit">Publicar Case</Button>
                              </form>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {projeto.tipo === "produto_proprio" && (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-zinc-900">Build Log</h3>
                        <form action={criarBuildLogAction} className="mt-2 max-w-md space-y-4">
                          <input type="hidden" name="projetoId" value={projeto.id} />
                          <TextareaField label="Contexto" name="contexto" />
                          <TextareaField label="Quebra" name="quebra" />
                          <TextareaField label="Decisão" name="decisao" />
                          <TextareaField label="Próximo passo" name="proximoPasso" />
                          <Button type="submit">Criar Build Log (rascunho)</Button>
                        </form>

                        {buildLogs.map((log) => (
                          <div key={log.id} className="mt-3 max-w-md space-y-2">
                            <Badge variant={variantDoStatusBuildLog(log.status)}>{log.status}</Badge>
                            <form action={atualizarBuildLogAction} className="space-y-2">
                              <input type="hidden" name="buildLogId" value={log.id} />
                              <Input type="text" name="contexto" defaultValue={log.contexto ?? ""} placeholder="Contexto" />
                              <Input type="text" name="quebra" defaultValue={log.quebra ?? ""} placeholder="Quebra" />
                              <Input type="text" name="decisao" defaultValue={log.decisao ?? ""} placeholder="Decisão" />
                              <Input type="text" name="proximoPasso" defaultValue={log.proximoPasso ?? ""} placeholder="Próximo passo" />
                              <Button type="submit">Salvar</Button>
                            </form>
                            {log.status === "rascunho" && (
                              <form action={publicarBuildLogAction}>
                                <input type="hidden" name="buildLogId" value={log.id} />
                                <Button type="submit">Publicar</Button>
                              </form>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </Section>
      </div>
    </div>
  );
}
