/**
 * Canal — conceito compartilhado entre os Bounded Contexts Cases e
 * Conteúdo (mesmos 5 canais em ambos, SOM Cap. 3.7/9.3).
 *
 * Movido para Shared nesta Sprint (6) porque Conteúdo passou a
 * precisar do mesmo conceito já usado por Case (Sprint 5) —
 * extensão aditiva e compatível, não altera o comportamento já
 * aprovado de Case.
 */
export const CANAIS = ["linkedin", "instagram", "x", "youtube", "newsletter"] as const;
export type Canal = (typeof CANAIS)[number];
