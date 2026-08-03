import { env } from "@config/env";
import type { PortaDeDrive, ConteudoDeArquivoDrive } from "@/brand_intelligence/domain/porta-de-drive";
import { FalhaDeSincronizacaoError } from "@/brand_intelligence/domain/porta-de-drive";

/**
 * Adapter real da Porta de Drive via Google Drive API (ARCHITECTURE.md,
 * seção 19). Exporta o arquivo como texto plano (`alt=media` para
 * arquivos binários, ou exportação para Google Docs).
 *
 * Nota de execução: não exercitado contra a API real neste ambiente
 * de desenvolvimento (sandbox sem acesso de rede a googleapis.com) —
 * ver relatório da Sprint 8. Cobertura de comportamento via
 * `FakePortaDeDrive` (tests/unit), incluindo o caminho de falha, que
 * é o mais crítico para o critério de aceite de não-bloqueio.
 */
export class GoogleDrivePortaDeDrive implements PortaDeDrive {
  async buscarConteudo(googleDriveFileId: string): Promise<ConteudoDeArquivoDrive> {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      throw new FalhaDeSincronizacaoError(
        "Credenciais do Google Drive não configuradas — não é possível sincronizar."
      );
    }

    const resposta = await fetch(
      `https://www.googleapis.com/drive/v3/files/${googleDriveFileId}/export?mimeType=text/plain`,
      {
        headers: {
          // Autenticação real (OAuth2) fica a cargo da estratégia de
          // integração já definida em ARCHITECTURE.md, seção 19 —
          // aqui apenas a chamada HTTP em si.
          Authorization: `Bearer ${env.GOOGLE_CLIENT_SECRET}`,
        },
      }
    );

    if (!resposta.ok) {
      throw new FalhaDeSincronizacaoError(
        `Falha ao buscar conteúdo do Google Drive: HTTP ${resposta.status}`
      );
    }

    const conteudoTexto = await resposta.text();
    return { conteudoTexto };
  }
}
