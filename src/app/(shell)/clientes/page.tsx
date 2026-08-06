import { listarClientes } from "@/clientes/application/listar-clientes";
import { criarDependenciasDeClientes } from "@/clientes/infrastructure/composicao";

/**
 * Clientes — Sprint 4.
 *
 * Lista os Clientes já classificados pela árvore de decisão do
 * Cap. 7.1, com prioridade visual conforme a classificação
 * (UI_UX.md, seção 9 — critério já usado para Projetos, reaproveitado
 * aqui pela mesma lógica de prioridade).
 */
export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const deps = criarDependenciasDeClientes();
  const clientes = await listarClientes({}, { clienteRepository: deps.clienteRepository });

  return (
    <div>
      <h1>Clientes</h1>
      {clientes.length === 0 && <p>Nenhum cliente ainda — converta um Lead no Pipeline Comercial.</p>}
      <ul>
        {clientes.map((cliente) => (
          <li key={cliente.id}>
            <p>
              <strong>{cliente.nome}</strong> {cliente.setor && `· ${cliente.setor}`} ·{" "}
              <em>{cliente.status}</em>
            </p>
            <p>Classificação: {cliente.classificacaoResultante ?? "não avaliado"}</p>
            {/* UX_REPORT.md — Sprint 22: sem isto, não havia forma de
                obter o ID exigido pelo campo "Cliente (uuid)" em
                Projetos a não ser consultando o banco diretamente. */}
            <p>
              ID (para criar Projeto): <code>{cliente.id}</code>
            </p>
            {cliente.origemLeadId && <p>Origem: Lead {cliente.origemLeadId}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
