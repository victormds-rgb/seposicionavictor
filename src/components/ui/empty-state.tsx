/**
 * EmptyState — mensagem de "nada aqui" (Sprint 26). Mesmo padrão
 * textual ("Nenhum X ainda") que já existe em Clientes, Projetos,
 * Conteúdo etc. — centraliza o estilo em vez de repetir a classe.
 */
export function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-zinc-500">{message}</p>;
}
