import { listarPecasDeConteudo } from "@/conteudo/application/listar-pecas-de-conteudo";
import { calcularDistribuicaoDePilares } from "@/conteudo/application/calcular-distribuicao-de-pilares";
import { criarDependenciasDeConteudo } from "@/conteudo/infrastructure/composicao";
import { criarDependenciasDeConhecimento } from "@/conhecimento/infrastructure/composicao";
import { sugerirAbordagemParaPecaSemCase } from "@/conhecimento/application/sugerir-abordagem-para-peca-sem-case";
import { CANAIS } from "@/shared/enums/canal";
import { criarPecaAction, criarDerivacaoAction, avancarStatusAction, publicarPecaAction } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { SelectField } from "@/components/ui/select-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { RadioGroup } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

/**
 * Conteúdo — Sprint 6, integrado ao Bounded Context Conhecimento na
 * Sprint 7 (estilo Sprint 28, Design System já existente): a seção
 * "Sem case? Siga a árvore" aplica a RegraDeDecisao do SOM Cap. 2.6
 * (via query string, sem alterar o fluxo já aprovado de criação
 * autônoma/derivação da Sprint 6).
 */
export const dynamic = "force-dynamic";

// Mapeamento puro de apresentação — mesmo padrão do Pipeline/Clientes/
// Projetos: o Badge não sabe o que os status significam.
function variantDoStatusPeca(status: string): "neutral" | "warning" | "success" {
  if (status === "publicado") return "success";
  if (status === "agendado") return "warning";
  return "neutral";
}

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
      <PageHeader title="Conteúdo" />

      <div className="space-y-4">
        <Section title="Sem case pessoal? Siga a árvore (SOM Cap. 2.6)">
          <form className="max-w-md space-y-4">
            <RadioGroup
              legend="Tenho case pessoal ou de cliente sobre o assunto?"
              name="temCaso"
              required
              options={[
                { value: "sim", label: "Sim" },
                { value: "nao", label: "Não" },
              ]}
            />
            <RadioGroup
              legend="É tendência/notícia/tema de terceiros?"
              name="tendencia"
              required
              options={[
                { value: "sim", label: "Sim" },
                { value: "nao", label: "Não" },
              ]}
            />
            <RadioGroup
              legend="É reflexão pessoal/aprendizado em andamento?"
              name="reflexao"
              required
              options={[
                { value: "sim", label: "Sim" },
                { value: "nao", label: "Não" },
              ]}
            />
            <Button type="submit">Consultar árvore</Button>
          </form>

          {sugestao && (
            <p className="mt-4 text-sm text-zinc-700">
              <strong className="font-medium">Recomendação:</strong>{" "}
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
        </Section>

        <Section title="Nova Peça (autônoma)">
          <form action={criarPecaAction} className="max-w-md space-y-4">
            <input type="hidden" name="origemTipo" value="autonomo" />
            <SelectField label="Canal" name="canal" defaultValue="linkedin">
              {CANAIS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </SelectField>
            <SelectField label="Pilar" name="pilarId" required>
              {pilares.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.pesoAlvoPercentual}%)
                </option>
              ))}
            </SelectField>
            <TextareaField label="Conteúdo" name="conteudoTexto" />
            <Button type="submit">Criar</Button>
          </form>
        </Section>

        <Section title="Distribuição de Pilares (real vs. meta)">
          <ul className="space-y-2 text-sm text-zinc-700">
            {distribuicao.map((d) => (
              <li key={d.pilarId} className="border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
                {d.nome}: meta {d.pesoAlvoPercentual}% · real {d.pesoRealPercentual}% ·{" "}
                {d.totalPublicadas} publicadas · desvio {d.desvio > 0 ? "+" : ""}
                {d.desvio}%
              </li>
            ))}
          </ul>
        </Section>

        <Section title={`Peças (${pecas.length})`}>
          {pecas.length === 0 && <EmptyState message="Nenhuma peça ainda." />}
          <ul className="space-y-4">
            {pecas.map((peca) => (
              <li key={peca.id} className="border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
                <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-900">
                  <strong className="font-medium">{peca.canal}</strong>
                  <span className="text-zinc-500">{peca.origemTipo}</span>
                  <Badge variant={variantDoStatusPeca(peca.status)}>{peca.status}</Badge>
                  {peca.pecaOrigemId && (
                    <span className="text-zinc-500">derivada de {peca.pecaOrigemId}</span>
                  )}
                </p>
                {peca.conteudoTexto && <p className="mt-1 text-sm text-zinc-700">{peca.conteudoTexto}</p>}

                {peca.status !== "publicado" && (
                  <form action={avancarStatusAction} className="mt-2">
                    <input type="hidden" name="pecaId" value={peca.id} />
                    <Button type="submit">Avançar etapa</Button>
                  </form>
                )}

                {peca.status === "agendado" && (
                  <form action={publicarPecaAction} className="mt-2">
                    <input type="hidden" name="pecaId" value={peca.id} />
                    <Button type="submit">Publicar agora</Button>
                  </form>
                )}

                {peca.status === "publicado" && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-zinc-700">
                      Criar derivação (mais curta) a partir desta peça
                    </summary>
                    <form action={criarDerivacaoAction} className="mt-3 max-w-md space-y-4">
                      <input type="hidden" name="pecaOrigemId" value={peca.id} />
                      <SelectField
                        label={`Canal da derivação (precisa ser mais curto que "${peca.canal}")`}
                        name="canalDerivada"
                        defaultValue="x"
                      >
                        {CANAIS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </SelectField>
                      <SelectField label="Pilar" name="pilarId" required>
                        {pilares.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome}
                          </option>
                        ))}
                      </SelectField>
                      <Button type="submit">Criar derivação</Button>
                    </form>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
