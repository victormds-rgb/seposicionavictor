import { listarClientes } from "@/clientes/application/listar-clientes";
import { criarDependenciasDeClientes } from "@/clientes/infrastructure/composicao";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Clientes — Sprint 4, estilo Sprint 28 (Design System já existente,
 * sem componentes novos).
 *
 * Lista os Clientes já classificados pela árvore de decisão do
 * Cap. 7.1, com prioridade visual conforme a classificação
 * (UI_UX.md, seção 9 — critério já usado para Projetos, reaproveitado
 * aqui pela mesma lógica de prioridade).
 */
export const dynamic = "force-dynamic";

// Mapeamento puro de apresentação — mesmo padrão do Pipeline
// (variantDoStatus/variantDaTemperatura): o Badge não sabe o que
// "ativo" ou "prioridade_alta" significam, só recebe a variant.
function variantDoStatus(status: string): "neutral" | "warning" | "danger" | "success" {
  if (status === "ativo") return "success";
  if (status === "em_avaliacao") return "warning";
  return "neutral";
}

function variantDaClassificacao(classificacao: string): "neutral" | "warning" | "success" {
  if (classificacao === "prioridade_alta") return "success";
  if (classificacao === "exigir_contrato_reforcado") return "warning";
  return "neutral";
}

export default async function ClientesPage() {
  const deps = criarDependenciasDeClientes();
  const clientes = await listarClientes({}, { clienteRepository: deps.clienteRepository });

  return (
    <div>
      <PageHeader title="Clientes" />

      <Section title={`Clientes (${clientes.length})`}>
        {clientes.length === 0 && (
          <EmptyState message="Nenhum cliente ainda — converta um Lead no Pipeline Comercial." />
        )}
        <ul className="space-y-4">
          {clientes.map((cliente) => (
            <li key={cliente.id} className="border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
              <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-900">
                <strong className="font-medium">{cliente.nome}</strong>
                {cliente.setor && <span className="text-zinc-500">{cliente.setor}</span>}
                <Badge variant={variantDoStatus(cliente.status)}>{cliente.status}</Badge>
                {cliente.classificacaoResultante && (
                  <Badge variant={variantDaClassificacao(cliente.classificacaoResultante)}>
                    {cliente.classificacaoResultante}
                  </Badge>
                )}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Classificação: {cliente.classificacaoResultante ?? "não avaliado"}
              </p>
              {/* UX_REPORT.md — Sprint 22: sem isto, não havia forma de
                  obter o ID exigido pelo campo "Cliente (uuid)" em
                  Projetos a não ser consultando o banco diretamente. */}
              <p className="mt-1 text-sm text-zinc-500">
                ID (para criar Projeto): <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">{cliente.id}</code>
              </p>
              {cliente.origemLeadId && (
                <p className="mt-1 text-sm text-zinc-500">Origem: Lead {cliente.origemLeadId}</p>
              )}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
