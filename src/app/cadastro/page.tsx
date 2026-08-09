import Link from "next/link";
import { signUp } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";

/**
 * Página de cadastro — Sprint 40 (Ativação do Primeiro Acesso).
 * Mesma linguagem visual do Login (src/app/login/page.tsx): Card
 * único centralizado, mesmos componentes de formulário. `signUp`
 * (actions.ts) valida tudo no servidor, inclusive a allowlist — esta
 * página só apresenta os erros/mensagens que ele devolve via query
 * string, nunca decide sozinha se um cadastro é permitido.
 */
export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; sucesso?: string }>;
}) {
  const { erro, sucesso } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-lg font-semibold text-zinc-900">Criar conta no MeuCMO</h1>
        <p className="mt-1 text-sm text-zinc-500">Seu Diretor de Marketing movido por IA.</p>

        {sucesso === "confirme-seu-email" ? (
          <p className="mt-4 text-sm text-zinc-700">
            Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.
          </p>
        ) : (
          <form action={signUp} className="mt-6 space-y-4">
            <FormField label="Nome">
              <Input type="text" name="nome" required />
            </FormField>
            <FormField label="E-mail">
              <Input type="email" name="email" required />
            </FormField>
            <FormField label="Senha">
              <Input type="password" name="senha" required />
            </FormField>
            <FormField label="Confirmar senha">
              <Input type="password" name="confirmarSenha" required />
            </FormField>
            <Button type="submit" className="w-full">
              Criar minha conta
            </Button>
          </form>
        )}
        {erro ? (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {erro}
          </p>
        ) : null}

        <div className="mt-6 border-t border-zinc-200 pt-4 text-center text-sm">
          <p className="text-zinc-500">Já tem uma conta?</p>
          <Link href="/login" className="mt-1 block font-medium text-zinc-900 underline">
            Entrar
          </Link>
        </div>
      </Card>
    </main>
  );
}
