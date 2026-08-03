import { signIn } from "./actions";
import { SubmitButton } from "../(shell)/_components/submit-button";

/**
 * Página de login mínima — Sprint 0.
 * Existe apenas para satisfazer o critério de aceite "autenticação
 * impede acesso não autorizado". Layout, identidade visual e
 * navegação pertencem a fases futuras (DESIGN_SYSTEM.md / Sprint 1).
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main>
      <h1>SEPosicionaVictor</h1>
      <form action={signIn}>
        <label>
          E-mail
          <input type="email" name="email" required />
        </label>
        <label>
          Senha
          <input type="password" name="password" required />
        </label>
        <SubmitButton>Entrar</SubmitButton>
      </form>
      {erro ? <p role="alert">{erro}</p> : null}
    </main>
  );
}
