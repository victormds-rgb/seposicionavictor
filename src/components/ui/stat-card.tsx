/**
 * StatCard — rótulo + número (Sprint 26; reforço de presença na
 * Sprint de UX/UI — métrica precisa parecer métrica, não uma legenda
 * qualquer). Célula de uma grade de resumo executivo — reutilizável
 * em qualquer tela com contagem rápida, não exclusiva do Dashboard.
 * Tokens "Graphite & Signal" no Checkpoint G — só usado no Dashboard
 * hoje, então essa troca não afeta nenhuma outra página.
 */
export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface p-4">
      <p className="text-xs font-medium text-ink-tertiary">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-ink-primary">{value}</p>
    </div>
  );
}
