/**
 * PageHeader — título de página (Sprint 26). Mesmo padrão de
 * `<h1>{Nome}</h1>` que toda tela do Shell já usa hoje.
 */
export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
      {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
    </div>
  );
}
