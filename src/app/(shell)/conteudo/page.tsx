import { listarPecasDeConteudo } from "@/conteudo/application/listar-pecas-de-conteudo";
import { calcularDistribuicaoDePilares } from "@/conteudo/application/calcular-distribuicao-de-pilares";
import { criarDependenciasDeConteudo } from "@/conteudo/infrastructure/composicao";
import { criarDependenciasDeConhecimento } from "@/conhecimento/infrastructure/composicao";
import { sugerirAbordagemParaPecaSemCase } from "@/conhecimento/application/sugerir-abordagem-para-peca-sem-case";
import { CANAIS } from "@/shared/enums/canal";
import { criarPecaAction, criarDerivacaoAction, avancarStatusAction, publicarPecaAction } from "./actions";
import { SubmitButton } from "../_components/submit-button";

/**
 * Conteúdo — Sprint 6, integrado ao Bounded Context Conhecimento na
 * Sprint 7: a seção "Sem case? Siga a árvore" aplica a RegraDeDecisao
 * do SOM Cap. 2.6 (via query string, sem alterar o fluxo já aprovado
 * de criação autônoma/derivação da Sprint 6).
 */
export const dynamic = "force-dynamic";

export default async function ConteudoPage({
  searchParams,
}: {
  searchParams: Promise<{ temCaso?: string; tendencia?: string; reflexao?: string }>;
}) {
  const params = await searchParams;
  const deps = criarDependenciasDeConteudo();
  const depsConhecimento = criarDependenciasDeConhecimento();
  const pecas = await listarPecasDeConteudo({}, { pecaDeConteudoRepository: deps.pecaDeConteudoRepository });
  const pilares = await deps.pilarRepository.listar();
  const distribuicao = await calcularDistribuicaoDePilares(undefined, deps);

  const respondeuArvore = params.temCaso !== undefined;
  const sugestao = respondeuArvore
    ? await sugerirAbordagemParaPecaSemCase(
        {
          temCasoPessoalOuDeCliente: params.temCaso === "sim",
          ehTendenciaOuNoticiaDeTerceiros: params.tendencia === "sim",
          ehReflexaoPessoalOuAprendizado: params.reflexao === "sim",
        },
        { temaMapeadoRepository: depsConhecimento.temaMapeadoRepository }
      )
    : null;

  return (
    <div>
      <h1>Conteúdo</h1>

      <section aria-labelledby="sem-case">
        <h2 id="sem-case">Sem case pessoal? Siga a árvore (SOM Cap. 2.6)</h2>
        <form>
          <p>Tenho case pessoal ou de cliente sobre o assunto?</p>
          <label>
            <input type="radio" name="temCaso" value="sim" required /> Sim
          </label>
          <label>
            <input type="radio" name="temCaso" value="nao" /> Não
          </label>
          <p>É tendência/notícia/tema de terceiros?</p>
          <label>
            <input type="radio" name="tendencia" value="sim" /> Sim
          </label>
          <label>
            <input type="radio" name="tendencia" value="nao" required /> Não
          </label>
          <p>É reflexão pessoal/aprendizado em andamento?</p>
          <label>
            <input type="radio" name="reflexao" value="sim" /> Sim
          </label>
          <label>
            <input type="radio" name="reflexao" value="nao" required /> Não
          </label>
          <SubmitButton>Consultar árvore</SubmitButton>
        </form>

        {sugestao && (
          <p>
            <strong>Recomendação:</strong>{" "}
            {
              {
                usar_prova_e_portfolio: "use Prova e Portfólio (Capítulo 5) — você já tem case.",
                aplicar_framework_critico:
                  "aplique o Framework 1 (Diagnóstico Antes da Ferramenta) ou 2 (Régua da Desculpa) como lente crítica.",
                usar_quebra_recuo_volta_ou_perguntas:
                  "use Quebra-Recuo-Volta ou o Banco de Perguntas Recorrentes.",
                nao_publicar_ainda: "não publique ainda — falta ângulo próprio.",
              }[sugestao.recomendacao]
            }
          </p>
        )}
      </section>

      <section aria-labelledby="nova-peca">
        <h2 id="nova-peca">Nova Peça (autônoma)</h2>
        <form action={criarPecaAction}>
          <input type="hidden" name="origemTipo" value="autonomo" />
          <label>
            Canal
            <select name="canal" defaultValue="linkedin">
              {CANAIS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Pilar
            <select name="pilarId" required>
              {pilares.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.pesoAlvoPercentual}%)
                </option>
              ))}
            </select>
          </label>
          <label>
            Conteúdo
            <textarea name="conteudoTexto" />
          </label>
          <SubmitButton>Criar</SubmitButton>
        </form>
      </section>

      <section aria-labelledby="distribuicao-pilares">
        <h2 id="distribuicao-pilares">Distribuição de Pilares (real vs. meta)</h2>
        <ul>
          {distribuicao.map((d) => (
            <li key={d.pilarId}>
              {d.nome}: meta {d.pesoAlvoPercentual}% · real {d.pesoRealPercentual}% ·{" "}
              {d.totalPublicadas} publicadas · desvio {d.desvio > 0 ? "+" : ""}
              {d.desvio}%
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="lista-pecas">
        <h2 id="lista-pecas">Peças ({pecas.length})</h2>
        {pecas.length === 0 && <p>Nenhuma peça ainda.</p>}
        <ul>
          {pecas.map((peca) => (
            <li key={peca.id}>
              <p>
                <strong>{peca.canal}</strong> · {peca.origemTipo} · <em>{peca.status}</em>
                {peca.pecaOrigemId && ` · derivada de ${peca.pecaOrigemId}`}
              </p>
              {peca.conteudoTexto && <p>{peca.conteudoTexto}</p>}

              {peca.status !== "publicado" && (
                <form action={avancarStatusAction}>
                  <input type="hidden" name="pecaId" value={peca.id} />
                  <SubmitButton>Avançar etapa</SubmitButton>
                </form>
              )}

              {peca.status === "agendado" && (
                <form action={publicarPecaAction}>
                  <input type="hidden" name="pecaId" value={peca.id} />
                  <SubmitButton>Publicar agora</SubmitButton>
                </form>
              )}

              {peca.status !== "publicado" ? null : (
                <details>
                  <summary>Criar derivação (mais curta) a partir desta peça</summary>
                  <form action={criarDerivacaoAction}>
                    <input type="hidden" name="pecaOrigemId" value={peca.id} />
                    <label>
                      Canal da derivação (precisa ser mais curto que &quot;{peca.canal}&quot;)
                      <select name="canalDerivada" defaultValue="x">
                        {CANAIS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Pilar
                      <select name="pilarId" required>
                        {pilares.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome}
                          </option>
                        ))}
                      </select>
                    </label>
                    <SubmitButton>Criar derivação</SubmitButton>
                  </form>
                </details>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
