import Link from "next/link";
import { signIn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";

/**
 * Página de login — Sprint 24 (Primeira versão visual), rebranding
 * "MeuCMO" na Sprint 32, link de cadastro funcional na Sprint 40.
 *
 * Camada de apresentação apenas: `signIn` (actions.ts) não foi
 * alterado — mesmos campos (`email`/`password`), mesmo fluxo de erro
 * via `?erro=`. O campo "Workspace" é só apresentação (desabilitado,
 * sem `name`, nunca enviado no FormData) — comunica que o sistema
 * trabalha com Workspaces sem implementar nenhuma funcionalidade
 * nova, conforme escopo da Sprint 32.
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
        <h1 className="text-lg font-semibold text-zinc-900">MeuCMO</h1>
        <p className="mt-1 text-sm text-zinc-500">Seu Diretor de Marketing movido por IA.</p>

        <form action={signIn} className="mt-6 space-y-4">
          <FormField label="Workspace">
            <Input type="text" placeholder="Em breve" disabled />
          </FormField>
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

        <div className="mt-6 border-t border-zinc-200 pt-4 text-center text-sm">
          <p className="text-zinc-500">Primeiro acesso?</p>
          <Link href="/cadastro" className="mt-1 block font-medium text-zinc-900 underline">
            Criar minha conta
          </Link>
        </div>
      </Card>
    </main>
  );
}
