import { listarProjetos } from "@/projetos/application/listar-e-encerrar-projeto";
import { listarCasesDoProjeto } from "@/cases/application/publicar-case";
import { listarBuildLogsDoProjeto } from "@/build_logs/application/build-log-use-cases";
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
import { SubmitButton } from "../_components/submit-button";

/**
 * Projetos — Sprint 5.
 *
 * Case e Build Log aparecem como abas dentro do Projeto
 * (INFORMATION_ARCHITECTURE.md, seção 5 — nunca navegados
 * isoladamente sem o contexto do Projeto de origem).
 */
export const dynamic = "force-dynamic";

export default async function ProjetosPage() {
  const deps = criarDependenciasDeProjetos();
  const projetos = await listarProjetos({}, { projetoRepository: deps.projetoRepository });

  return (
    <div>
      <h1>Projetos</h1>

      <section aria-labelledby="novo-projeto">
        <h2 id="novo-projeto">Novo Projeto</h2>
        <form action={criarProjetoAction}>
          <label>
            Nome
            <input type="text" name="nome" required />
          </label>
          <label>
            Tipo
            <select name="tipo" defaultValue="cliente_externo">
              <option value="cliente_externo">Cliente externo</option>
              <option value="produto_proprio">Produto próprio</option>
            </select>
          </label>
          <label>
            Cliente (uuid, obrigatório se cliente externo)
            <input type="text" name="clienteId" />
          </label>
          <label>
            Desculpa inicial (obrigatório se cliente externo)
            <textarea name="desculpaInicial" />
          </label>
          <label>
            Custo mensal (obrigatório se cliente externo)
            <input type="number" name="custoMensal" step="0.01" />
          </label>
          <SubmitButton>Criar Projeto</SubmitButton>
        </form>
      </section>

      <section aria-labelledby="lista-projetos">
        <h2 id="lista-projetos">Projetos ({projetos.length})</h2>
        {projetos.length === 0 && <p>Nenhum projeto ainda.</p>}
        <ul>
          {await Promise.all(
            projetos.map(async (projeto) => {
              const cases = await listarCasesDoProjeto(projeto.id, {
                caseRepository: deps.caseRepository,
              });
              const buildLogs = await listarBuildLogsDoProjeto(projeto.id, {
                buildLogRepository: deps.buildLogRepository,
              });
              const camposCompletos = camposDeCaseCompletos(projeto);

              return (
                <li key={projeto.id}>
                  <p>
                    <strong>{projeto.nome}</strong> · {projeto.tipo} · <em>{projeto.status}</em>
                  </p>
                  <p>
                    Progresso dos 6 campos de case:{" "}
                    {camposCompletos ? "completo" : "em preenchimento"}
                  </p>

                  {projeto.status !== "encerrado" && projeto.status !== "pronto_para_case" && (
                    <form action={atualizarCamposDeCaseAction}>
                      <input type="hidden" name="projetoId" value={projeto.id} />
                      <label>
                        Momento da quebra
                        <input type="text" name="momentoQuebra" defaultValue={projeto.momentoQuebra ?? ""} />
                      </label>
                      <label>
                        Solução
                        <input type="text" name="solucao" defaultValue={projeto.solucao ?? ""} />
                      </label>
                      <label>
                        Tempo
                        <input type="text" name="tempoDecorrido" defaultValue={projeto.tempoDecorrido ?? ""} />
                      </label>
                      <label>
                        Número (resultado)
                        <input type="text" name="numeroResultado" defaultValue={projeto.numeroResultado ?? ""} />
                      </label>
                      <SubmitButton>Atualizar campos de case</SubmitButton>
                    </form>
                  )}

                  {projeto.status === "pronto_para_case" && cases.length === 0 && (
                    <form action={criarCaseAction}>
                      <input type="hidden" name="projetoId" value={projeto.id} />
                      <SubmitButton>Criar Case a partir deste Projeto</SubmitButton>
                    </form>
                  )}

                  {projeto.tipo === "produto_proprio" && (
                    <details>
                      <summary>Critérios de Lançamento</summary>
                      {(await deps.projetoRepository.listarCriteriosDeLancamento(projeto.id)).map(
                        (criterio) => (
                          <div key={criterio.id}>
                            <p>
                              {criterio.descricaoFeature} — <em>{criterio.status}</em>
                            </p>
                            {criterio.status === "pendente" && (
                              <form action={satisfazerCriterioAction}>
                                <input type="hidden" name="criterioId" value={criterio.id} />
                                <SubmitButton>
                                  Satisfazer (&quot;ficou muito bom, vai me ajudar&quot;)
                                </SubmitButton>
                              </form>
                            )}
                          </div>
                        )
                      )}
                      <form action={criarCriterioAction}>
                        <input type="hidden" name="projetoId" value={projeto.id} />
                        <input type="text" name="descricaoFeature" placeholder="Descrição da feature" required />
                        <SubmitButton>Adicionar critério</SubmitButton>
                      </form>
                    </details>
                  )}

                  {projeto.status !== "encerrado" && (
                    <form action={encerrarProjetoAction}>
                      <input type="hidden" name="projetoId" value={projeto.id} />
                      <SubmitButton>Encerrar Projeto</SubmitButton>
                    </form>
                  )}

                  {cases.length > 0 && (
                    <section aria-label="Cases deste projeto">
                      <h3>Case</h3>
                      {cases.map((caso) => (
                        <div key={caso.id}>
                          <p>Status: {caso.status}</p>
                          <form action={atualizarCaseAction}>
                            <input type="hidden" name="caseId" value={caso.id} />
                            <input type="text" name="desculpa" defaultValue={caso.desculpa ?? ""} placeholder="Desculpa" />
                            <input type="number" name="custo" step="0.01" defaultValue={caso.custo ?? ""} placeholder="Custo" />
                            <input type="text" name="momentoQuebra" defaultValue={caso.momentoQuebra ?? ""} placeholder="Momento da quebra" />
                            <input type="text" name="solucao" defaultValue={caso.solucao ?? ""} placeholder="Solução" />
                            <input type="text" name="tempo" defaultValue={caso.tempo ?? ""} placeholder="Tempo" />
                            <input type="text" name="numeroResultado" defaultValue={caso.numeroResultado ?? ""} placeholder="Número" />
                            <SubmitButton>Salvar edição (gera histórico)</SubmitButton>
                          </form>
                          {caso.status === "completo" && (
                            <form action={publicarCaseAction}>
                              <input type="hidden" name="caseId" value={caso.id} />
                              <SubmitButton>Publicar Case</SubmitButton>
                            </form>
                          )}
                        </div>
                      ))}
                    </section>
                  )}

                  {projeto.tipo === "produto_proprio" && (
                    <section aria-label="Build Logs deste projeto">
                      <h3>Build Log</h3>
                      <form action={criarBuildLogAction}>
                        <input type="hidden" name="projetoId" value={projeto.id} />
                        <textarea name="contexto" placeholder="Contexto" />
                        <textarea name="quebra" placeholder="Quebra" />
                        <textarea name="decisao" placeholder="Decisão" />
                        <textarea name="proximoPasso" placeholder="Próximo passo" />
                        <SubmitButton>Criar Build Log (rascunho)</SubmitButton>
                      </form>

                      {buildLogs.map((log) => (
                        <div key={log.id}>
                          <p>Status: {log.status}</p>
                          <form action={atualizarBuildLogAction}>
                            <input type="hidden" name="buildLogId" value={log.id} />
                            <input type="text" name="contexto" defaultValue={log.contexto ?? ""} />
                            <input type="text" name="quebra" defaultValue={log.quebra ?? ""} />
                            <input type="text" name="decisao" defaultValue={log.decisao ?? ""} />
                            <input type="text" name="proximoPasso" defaultValue={log.proximoPasso ?? ""} />
                            <SubmitButton>Salvar</SubmitButton>
                          </form>
                          {log.status === "rascunho" && (
                            <form action={publicarBuildLogAction}>
                              <input type="hidden" name="buildLogId" value={log.id} />
                              <SubmitButton>Publicar</SubmitButton>
                            </form>
                          )}
                        </div>
                      ))}
                    </section>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
