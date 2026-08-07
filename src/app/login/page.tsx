import { signIn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

/**
 * Página de login — Sprint 24 (Primeira versão visual).
 *
 * Camada de apresentação apenas: `signIn` (actions.ts) não foi
 * alterado — mesmos campos (`email`/`password`), mesmo fluxo de erro
 * via `?erro=`. Só o layout/estilo mudou.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-lg font-semibold text-zinc-900">SEPosicionaVictor</h1>
        <form action={signIn} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">E-mail</span>
            <Input type="email" name="email" required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">Senha</span>
            <Input type="password" name="password" required />
          </label>
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </form>
        {erro ? (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {erro}
          </p>
        ) : null}
      </Card>
    </main>
  );
}
