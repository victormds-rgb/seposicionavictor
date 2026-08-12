import { listarDocumentosOficiais, listarChunksDoDocumento } from "@/brand_intelligence/application/consultor-de-brand-intelligence";
import { criarDependenciasDeBrandIntelligence } from "@/brand_intelligence/infrastructure/composicao";
import { TIPOS_DOCUMENTO } from "@/brand_intelligence/domain/documento-oficial";
import { registrarDocumentoAction, sincronizarAgoraAction } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Button } from "@/components/ui/button";

/**
 * Brand Intelligence — Sprint 8, redesenhada na Sprint de UX/UI (Fase
 * 11 — a tela era HTML cru).
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

function variantDoStatusIndexacao(status: string): "neutral" | "info" | "warning" | "success" | "danger" {
  if (status === "indexado") return "success";
  if (status === "desatualizado") return "warning";
  if (status === "erro") return "danger";
  return "neutral";
}

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
      <PageHeader
        title="Brand Intelligence"
        description="Documentos oficiais da marca, sincronizados e indexados para a IA consultar."
      />

      <div className="space-y-6">
        <Section title="Registrar documento oficial">
          <form action={registrarDocumentoAction} className="max-w-md space-y-4">
            <FormField label="Título">
              <Input type="text" name="titulo" required />
            </FormField>
            <FormField label="ID do arquivo no Google Drive">
              <Input type="text" name="googleDriveFileId" required />
            </FormField>
            <SelectField label="Tipo" name="tipoDocumento" defaultValue="sistema_operacional_marca">
              {TIPOS_DOCUMENTO.map((t) => (
                <option key={t} value={t}>
                  {ROTULOS_TIPO_DOCUMENTO[t] ?? t}
                </option>
              ))}
            </SelectField>
            <Button type="submit">Registrar</Button>
          </form>
        </Section>

        <Section title={`Documentos (${documentos.length})`}>
          {documentos.length === 0 && <EmptyState message="Nenhum documento oficial registrado ainda." />}
          <ul className="space-y-3">
            {await Promise.all(
              documentos.map(async (doc) => {
                const chunks = await listarChunksDoDocumento(doc.id, {
                  documentoChunkRepository: deps.documentoChunkRepository,
                });

                return (
                  <li key={doc.id}>
                    <Card className="p-4 shadow-none">
                      <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-900">
                        <strong className="font-medium">{doc.titulo}</strong>
                        <span className="text-zinc-500">
                          {ROTULOS_TIPO_DOCUMENTO[doc.tipoDocumento] ?? doc.tipoDocumento}
                        </span>
                        <Badge variant={variantDoStatusIndexacao(doc.statusIndexacao)}>
                          {ROTULOS_STATUS_INDEXACAO[doc.statusIndexacao] ?? doc.statusIndexacao}
                        </Badge>
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {doc.ultimaSincronizacao
                          ? `Última sincronização: ${doc.ultimaSincronizacao.toLocaleString("pt-BR")}`
                          : "Nunca sincronizado"}{" "}
                        · {chunks.length} trecho(s) indexado(s)
                      </p>
                      <form action={sincronizarAgoraAction} className="mt-3">
                        <input type="hidden" name="documentoId" value={doc.id} />
                        <Button type="submit" variant="secondary">
                          Sincronizar agora
                        </Button>
                      </form>
                    </Card>
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
