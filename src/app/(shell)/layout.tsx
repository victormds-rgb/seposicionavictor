import { createSupabaseServerClient } from "@infra/auth/supabase-server";
import { listarAlertas } from "@/notificacoes/application/gestao-de-alertas";
import { criarDependenciasDeNotificacoes } from "@/notificacoes/infrastructure/composicao";
import { GlobalNavigation } from "./_components/global-navigation";
import { SignOutButton } from "./_components/sign-out-button";
import { QuickCapture } from "./_components/quick-capture";
import { Topbar } from "./_components/topbar";
import { Avatar } from "@/components/ui/avatar";

/**
 * Layout do Shell — Sprint 1, estilo Sprint 25, rebranding "MeuCMO"
 * na Sprint 32, reskin "Graphite & Signal" no Checkpoint F (App
 * Shell) do redesign de produto.
 *
 * Envolve todos os módulos da Navegação Global (UI_UX.md, seção 4).
 * "/login" fica fora deste grupo de rotas propositalmente (não deve
 * ter navegação — INTERACTION_MODEL.md, seção 2).
 *
 * Responsivo: sidebar fixa à esquerda a partir de `md`; abaixo disso,
 * a mesma navegação agrupada vive num Drawer acionado pelo topbar
 * (Checkpoint F — mobile deixou de ser uma barra horizontal
 * comprimida do desktop, ver `nav-drawer.tsx`).
 *
 * `getUser()`/`listarAlertas()` aqui são LEITURA apenas — mesmas
 * chamadas que o Dashboard já fazia, agora também no shell para
 * alimentar o nome exibido e o indicador de Alertas do topbar. Nada
 * no domínio `notificacoes`/auth foi alterado.
 */
export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const nomeExibido = (user?.user_metadata?.nome as string | undefined) ?? user?.email ?? "Victor";

  const deps = criarDependenciasDeNotificacoes();
  const alertasAtivos = await listarAlertas(
    { status: "ativo" },
    { alertaRepository: deps.alertaRepository }
  );

  return (
    <div className="min-h-screen bg-surface font-geist md:flex">
      <aside className="hidden shrink-0 border-r border-border-subtle bg-surface md:flex md:w-64 md:flex-col">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            M
          </div>
          <p className="text-sm font-semibold text-ink-primary">FDE</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <GlobalNavigation />
        </div>

        <div className="flex flex-col gap-2 border-t border-border-subtle p-3">
          <div className="flex items-center gap-2 px-1 py-1">
            <Avatar nome={nomeExibido} size="sm" />
            <p className="truncate text-sm font-medium text-ink-primary">{nomeExibido}</p>
          </div>
          <QuickCapture />
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar alertas={alertasAtivos} nomeExibido={nomeExibido} />

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
