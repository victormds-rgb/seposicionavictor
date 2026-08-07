import { signIn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";

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
          <FormField label="E-mail">
            <Input type="email" name="email" required />
          </FormField>
          <FormField label="Senha">
            <Input type="password" name="password" required />
          </FormField>
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
