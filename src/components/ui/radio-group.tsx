/**
 * RadioGroup — conjunto de opções de rádio sob um `name` (Sprint 27).
 * A estrutura "pergunta + Sim/Não" se repetia idêntica na árvore de
 * decisão do Pipeline (conversão em Cliente) e na árvore do Conteúdo
 * (Sem case? Siga a árvore) — só recebe `legend`/`name`/`options`
 * como props, não decide nada sobre o que as opções significam.
 */
export function RadioGroup({
  legend,
  name,
  options,
  required,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-zinc-700">{legend}</p>
      <div className="flex gap-4">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-1.5 text-sm text-zinc-700">
            <input
              type="radio"
              name={name}
              value={option.value}
              required={required}
              className="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-900"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
