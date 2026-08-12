import { cn } from "@/lib/cn";

const TAMANHOS = {
  sm: "size-6 text-xs",
  md: "size-8 text-sm",
  lg: "size-10 text-base",
} as const;

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}

/**
 * Avatar — Fase 2 (Design System FDE), prioridade 11. Uso previsto:
 * rodapé da sidebar (Fase 2-F) e menções de usuário em Activity/
 * Timeline futuros.
 */
export function Avatar({
  nome,
  src,
  size = "md",
  className,
}: {
  nome: string;
  src?: string;
  size?: keyof typeof TAMANHOS;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-tint font-semibold text-primary",
        TAMANHOS[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar vem de URL externa (Supabase Storage); sem next/image por simplicidade nesta fase
        <img src={src} alt={nome} className="size-full object-cover" />
      ) : (
        iniciais(nome)
      )}
    </span>
  );
}
