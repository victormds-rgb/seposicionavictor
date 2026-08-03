/**
 * Porta de Armazenamento Binário — interface que o domínio da Inbox
 * declara e a Infrastructure implementa (CODING_GUIDELINES.md, seção 2).
 *
 * Usada apenas para os tipos de entrada não-textuais do Quick Capture
 * (áudio, imagem, PDF, vídeo, print, documento). Implementação real
 * (Supabase Storage) vive em src/inbox/infrastructure.
 */
export interface ArquivoParaArmazenar {
  nomeOriginal: string;
  mimeType: string;
  tamanhoBytes: number;
  conteudo: Uint8Array;
}

export interface ResultadoArmazenamento {
  referencia: string;
}

export interface PortaDeArmazenamentoBinario {
  armazenar(arquivo: ArquivoParaArmazenar): Promise<ResultadoArmazenamento>;
}
