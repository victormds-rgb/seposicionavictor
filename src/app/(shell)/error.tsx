"use client";

/**
 * Error boundary do Shell (Sprint 15 — Green Deploy).
 *
 * Sem isso, qualquer erro lançado por um Server Action ou Server
 * Component dentro do Shell (ex.: validação de upload em
 * src/app/(shell)/inbox/actions.ts) caía no tratamento padrão do
 * Next.js — que em produção esconde `error.message` e mostra só um
 * "Application error" genérico com digest, mesmo quando a mensagem é
 * de negócio, segura e sem detalhe técnico nenhum (ex.: "Arquivo muito
 * grande (10.1MB). O limite é 10MB."). Este boundary exibe a mensagem
 * de erro tal como lançada — nenhuma stacktrace ou detalhe interno é
 * exposto porque nenhum dos `throw new Error(...)` do domínio inclui
 * isso (CODING_GUIDELINES.md, seção 6/11).
 */
export default function ShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <p role="alert">{error.message}</p>
      <button type="button" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
