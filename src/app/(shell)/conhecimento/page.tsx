import {
  listarFrameworks,
  listarTemasMapeados,
  listarAtivosDeConhecimento,
  listarRegrasDeDecisao,
} from "@/conhecimento/application/consultas";
import { criarDependenciasDeConhecimento } from "@/conhecimento/infrastructure/composicao";
import { registrarAtivoAction } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { Button } from "@/components/ui/button";

/**
 * Conhecimento — Sprint 7, redesenhada na Sprint de UX/UI (Fase 10 —
 * a tela era HTML cru, sem nenhum componente do Design System).
 *
 * Biblioteca de consulta rápida (UI_UX.md, seção 11) — os Frameworks,
 * os Temas Mapeados (SOM Cap. 2.5), as Regras de Decisão (Cap. 7.1 e
 * 2.6), e os Ativos de Conhecimento (Cap. 2.3 e 2.4). Não é um modo
 * tutorial — é referência rápida.
 */
export const dynamic = "force-dynamic";

// Sprint 33.5 (Refinamento): rótulo legível — antes "conteudo_sem_case"
// aparecia cru.
const ROTULOS_APLICACAO: Record<string, string> = {
  cliente: "Clientes",
  conteudo_sem_case: "Conteúdo sem case",
};

export default async function ConhecimentoPage() {
  const deps = criarDependenciasDeConhecimento();

  const frameworks = await listarFrameworks({ frameworkRepository: deps.frameworkRepository });
  const temas = await listarTemasMapeados({ temaMapeadoRepository: deps.temaMapeadoRepository });
  const ativos = await listarAtivosDeConhecimento(
    {},
    { ativoDeConhecimentoRepository: deps.ativoDeConhecimentoRepository }
  );
  const regras = await listarRegrasDeDecisao({ regraDeDecisaoRepository: deps.regraDeDecisaoRepository });

  const perguntas = ativos.filter((a) => a.tipo === "pergunta_recorrente");
  const analogias = ativos.filter((a) => a.tipo === "analogia");

  return (
    <div>
      <PageHeader
        title="Conhecimento"
        description="Referência rápida: frameworks, temas, regras de decisão e o banco de perguntas/analogias."
      />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title={`Frameworks (${frameworks.length})`}>
            {frameworks.length === 0 && <EmptyState message="Nenhum framework registrado." />}
            <ul className="space-y-3">
              {frameworks.map((f) => (
                <li key={f.id}>
                  <Card className="p-4 shadow-none">
                    <p className="text-sm font-medium text-zinc-900">{f.nome}</p>
                    <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-sm text-zinc-600">
                      {f.estruturaEtapas.map((etapa, i) => (
                        <li key={i}>{etapa}</li>
                      ))}
                    </ol>
                    {f.exemplosUso && <p className="mt-2 text-xs text-zinc-500">{f.exemplosUso}</p>}
                  </Card>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={`Temas mapeados (${temas.length})`}>
            {temas.length === 0 && <EmptyState message="Nenhum tema mapeado." />}
            <ul className="space-y-2 text-sm text-zinc-700">
              {temas.map((t) => (
                <li key={t.id} className="border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
                  <strong className="font-medium text-zinc-900">{t.nomeTema}</strong>:{" "}
                  {t.frameworks.length > 0
                    ? t.frameworks.map((f) => f.nome).join(", ")
                    : "sem framework — usa Perguntas Recorrentes"}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <Section title={`Regras de decisão (${regras.length})`}>
          {regras.length === 0 && <EmptyState message="Nenhuma regra de decisão registrada." />}
          <ul className="flex flex-wrap gap-2">
            {regras.map((r) => (
              <li key={r.id}>
                <Badge>
                  {r.nome} · {ROTULOS_APLICACAO[r.aplicaA] ?? r.aplicaA}
                </Badge>
              </li>
            ))}
          </ul>
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title={`Banco de perguntas recorrentes (${perguntas.length})`}>
            {perguntas.length === 0 && <EmptyState message="Nenhuma pergunta registrada." />}
            <ul className="space-y-2 text-sm text-zinc-700">
              {perguntas.map((p) => (
                <li key={p.id} className="border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
                  {p.conteudoTextual}{" "}
                  <span className="text-xs text-zinc-500">(usada {p.frequenciaUso}x)</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={`Banco de analogias (${analogias.length})`}>
            {analogias.length === 0 && <EmptyState message="Nenhuma analogia registrada." />}
            <ul className="space-y-2 text-sm text-zinc-700">
              {analogias.map((a) => (
                <li key={a.id} className="border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
                  {a.conteudoTextual}{" "}
                  <span className="text-xs text-zinc-500">(usada {a.frequenciaUso}x)</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <Section title="Registrar novo item">
          <form action={registrarAtivoAction} className="max-w-md space-y-4">
            <SelectField label="Tipo" name="tipo" defaultValue="pergunta_recorrente">
              <option value="pergunta_recorrente">Pergunta recorrente</option>
              <option value="analogia">Analogia</option>
            </SelectField>
            <TextareaField label="Conteúdo" name="conteudoTextual" required />
            <FormField label="Origem" help="opcional">
              <Input type="text" name="origem" />
            </FormField>
            <Button type="submit">Registrar</Button>
          </form>
        </Section>
      </div>
    </div>
  );
}
