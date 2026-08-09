/**
 * Sprint 40 (Ativação do Primeiro Acesso) — checa se um e-mail está
 * autorizado a criar conta. Função pura (sem I/O) para poder ser
 * testada sem tocar Supabase; `env.SIGNUP_ALLOWED_EMAILS` é lido só na
 * Server Action (src/app/cadastro/actions.ts).
 */
export function emailAutorizadoParaCadastro(email: string, listaBruta: string | undefined): boolean {
  if (!listaBruta) return false;

  const normalizado = email.trim().toLowerCase();
  const permitidos = listaBruta.split(",").map((e) => e.trim().toLowerCase());

  return permitidos.includes(normalizado);
}
