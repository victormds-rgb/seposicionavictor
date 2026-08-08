import { listarDocumentosOficiais, listarChunksDoDocumento } from "@/brand_intelligence/application/consultor-de-brand-intelligence";
import { criarDependenciasDeBrandIntelligence } from "@/brand_intelligence/infrastructure/composicao";
import { TIPOS_DOCUMENTO } from "@/brand_intelligence/domain/documento-oficial";
import { registrarDocumentoAction, sincronizarAgoraAction } from "./actions";
import { SubmitButton } from "../_components/submit-button";

/**
 * Brand Intelligence — Sprint 8.
 *
 * Lista de documentos com status de sincronização e botão único
 * "sincronizar agora" (UI_UX.md, seção 12) — sem exigir que Victor
 * entenda o mecanismo técnico por trás.
 */
export const dynamic = "force-dynamic";

// Sprint 33.5 (Refinamento): rótulos legíveis — antes apareciam crus
// ("sistema_operacional_marca", "nao_indexado") e "chunks" (termo de
// implementação) em vez de "trechos", contrariando a própria intenção
// desta tela (ver docstring acima: "sem exigir que Victor entenda o
// mecanismo técnico por trás").
const ROTULOS_TIPO_DOCUMENTO: Record<string, string> = {
  sistema_operacional_marca: "Sistema Operacional de Marca",
  manual_marca: "Manual de Marca",
  outro: "Outro",
};

const ROTULOS_STATUS_INDEXACAO: Record<string, string> = {
  nao_indexado: "Não indexado",
  indexado: "Indexado",
  desatualizado: "Desatualizado",
  erro: "Erro",
};

export default async function BrandIntelligencePage() {
  const deps = criarDependenciasDeBrandIntelligence();
  const documentos = await listarDocumentosOficiais({}, { documentoOficialRepository: deps.documentoOficialRepository });

  return (
    <div>
      <h1>Brand Intelligence</h1>

      <section aria-labelledby="novo-documento">
        <h2 id="novo-documento">Registrar Documento Oficial</h2>
        <form action={registrarDocumentoAction}>
          <label>
            Título
            <input type="text" name="titulo" required />
          </label>
          <label>
            ID do arquivo no Google Drive
            <input type="text" name="googleDriveFileId" required />
          </label>
          <label>
            Tipo
            <select name="tipoDocumento" defaultValue="sistema_operacional_marca">
              {TIPOS_DOCUMENTO.map((t) => (
                <option key={t} value={t}>
                  {ROTULOS_TIPO_DOCUMENTO[t] ?? t}
                </option>
              ))}
            </select>
          </label>
          <SubmitButton>Registrar</SubmitButton>
        </form>
      </section>

      <section aria-labelledby="documentos">
        <h2 id="documentos">Documentos ({documentos.length})</h2>
        {documentos.length === 0 && <p>Nenhum documento oficial registrado ainda.</p>}
        <ul>
          {await Promise.all(
            documentos.map(async (doc) => {
              const chunks = await listarChunksDoDocumento(doc.id, {
                documentoChunkRepository: deps.documentoChunkRepository,
              });

              return (
                <li key={doc.id}>
                  <p>
                    <strong>{doc.titulo}</strong> ·{" "}
                    {ROTULOS_TIPO_DOCUMENTO[doc.tipoDocumento] ?? doc.tipoDocumento} ·{" "}
                    <em>{ROTULOS_STATUS_INDEXACAO[doc.statusIndexacao] ?? doc.statusIndexacao}</em>
                  </p>
                  <p>
                    Última sincronização:{" "}
                    {doc.ultimaSincronizacao
                      ? doc.ultimaSincronizacao.toLocaleString("pt-BR")
                      : "nunca sincronizado"}{" "}
                    · {chunks.length} trecho(s) indexado(s)
                  </p>
                  <form action={sincronizarAgoraAction}>
                    <input type="hidden" name="documentoId" value={doc.id} />
                    <SubmitButton>Sincronizar agora</SubmitButton>
                  </form>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
