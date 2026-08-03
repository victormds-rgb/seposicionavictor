import { createSupabaseServiceClient } from "@infra/persistence/storage/supabase-storage-client";
import { env } from "@config/env";
import type {
  ArquivoParaArmazenar,
  PortaDeArmazenamentoBinario,
  ResultadoArmazenamento,
} from "@/inbox/domain/porta-de-armazenamento-binario";
import type { UuidGenerator } from "@/shared/domain/uuid-generator";

/**
 * Implementação real da Porta de Armazenamento Binário via Supabase
 * Storage. Nenhuma lógica de domínio aqui — apenas upload
 * (CODING_GUIDELINES.md, seção 6).
 *
 * Nota: não exercitada contra um bucket real neste ambiente de
 * desenvolvimento (sandbox sem acesso de rede a supabase.co) — ver
 * relatório da Sprint 2. A cobertura de teste desta funcionalidade é
 * feita via `FakePortaDeArmazenamentoBinario` (tests/unit).
 */
/**
 * Sanitiza o nome de arquivo enviado pelo usuário antes de compor o
 * caminho do objeto no Storage (Sprint 14 — Hardening Final, item 2).
 * Remove `/`, `\`, sequências `..`, caracteres de controle e qualquer
 * caractere fora de letras/números/`.`/`_`/`-` — preserva extensão e
 * o restante da estrutura do caminho (data/uuid- continuam intactos,
 * só o nome original em si é normalizado).
 */
function sanitizarNomeDeArquivo(nomeOriginal: string): string {
  const semControle = nomeOriginal.replace(/[\x00-\x1f\x7f]/g, "");
  const semSeparadores = semControle.replace(/[/\\]/g, "_");
  const semTraversal = semSeparadores.replace(/\.\.+/g, ".");
  const somenteSeguro = semTraversal.replace(/[^a-zA-Z0-9._-]/g, "_");
  const semPontosNoInicio = somenteSeguro.replace(/^\.+/, "");
  return semPontosNoInicio.slice(0, 200) || "arquivo";
}

export class SupabaseArmazenamentoBinario implements PortaDeArmazenamentoBinario {
  constructor(private readonly uuidGenerator: UuidGenerator) {}

  async armazenar(arquivo: ArquivoParaArmazenar): Promise<ResultadoArmazenamento> {
    const supabase = createSupabaseServiceClient();
    const nomeSanitizado = sanitizarNomeDeArquivo(arquivo.nomeOriginal);
    const caminho = `${new Date().toISOString().slice(0, 10)}/${this.uuidGenerator.generate()}-${nomeSanitizado}`;

    const { error } = await supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET_INBOX)
      .upload(caminho, arquivo.conteudo, {
        contentType: arquivo.mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Falha ao armazenar arquivo na Inbox: ${error.message}`);
    }

    return { referencia: caminho };
  }
}
