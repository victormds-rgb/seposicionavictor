/**
 * Porta de Drive — interface que o domínio da Brand Intelligence
 * declara e a Infrastructure implementa (CODING_GUIDELINES.md,
 * seção 2). Permite substituir o provider sem alterar Domain ou
 * Application (mesmo padrão Ports & Adapters já usado para IA na
 * Sprint 2 — ARCHITECTURE.md, seção 18).
 */
export interface ConteudoDeArquivoDrive {
  conteudoTexto: string;
}

export interface PortaDeDrive {
  buscarConteudo(googleDriveFileId: string): Promise<ConteudoDeArquivoDrive>;
}

export class FalhaDeSincronizacaoError extends Error {}
