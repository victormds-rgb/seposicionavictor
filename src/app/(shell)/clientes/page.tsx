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

// Sprint 33.5 (Refinamento): rótulos legíveis para os identificadores
// internos (antes apareciam crus: "em_avaliacao", "prioridade_alta",
// "exigir_contrato_reforcado", "cliente_de_caixa").
function rotuloDoStatus(status: string): string {
  return status === "em_avaliacao" ? "Em avaliação" : status;
}

const ROTULOS_CLASSIFICACAO: Record<string, string> = {
  prioridade_alta: "Prioridade Alta",
  exigir_contrato_reforcado: "Contrato Reforçado",
  cliente_de_caixa: "Cliente de Caixa",
};

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
          {await Promise.all(
            clientes.map(async (cliente) => {
              // Sprint 33.5 (Refinamento): mostra o nome do Lead de
              // origem em vez do uuid cru — mesmo padrão já usado em
              // Projetos (Sprint 23B) para o nome do Cliente.
              const leadDeOrigem = cliente.origemLeadId
                ? await deps.leadRepository.buscarPorId(cliente.origemLeadId)
                : null;

              return (
                <li key={cliente.id} className="border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-900">
                    <strong className="font-medium">{cliente.nome}</strong>
                    {cliente.setor && <span className="text-zinc-500">{cliente.setor}</span>}
                    <Badge variant={variantDoStatus(cliente.status)}>{rotuloDoStatus(cliente.status)}</Badge>
                    {cliente.classificacaoResultante && (
                      <Badge variant={variantDaClassificacao(cliente.classificacaoResultante)}>
                        {ROTULOS_CLASSIFICACAO[cliente.classificacaoResultante] ??
                          cliente.classificacaoResultante}
                      </Badge>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Classificação:{" "}
                    {cliente.classificacaoResultante
                      ? (ROTULOS_CLASSIFICACAO[cliente.classificacaoResultante] ??
                        cliente.classificacaoResultante)
                      : "não avaliado"}
                  </p>
                  {leadDeOrigem && (
                    <p className="mt-1 text-sm text-zinc-500">Origem: Lead &quot;{leadDeOrigem.nome}&quot;</p>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </Section>
    </div>
  );
}
