/**
 * StatCard — rótulo + número (Sprint 26). Célula de uma grade de
 * resumo executivo — reutilizável em qualquer tela com contagem
 * rápida, não exclusiva do Dashboard.
 */
export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
