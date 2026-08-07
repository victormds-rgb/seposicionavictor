import { GlobalNavigation } from "./_components/global-navigation";
import { SignOutButton } from "./_components/sign-out-button";
import { QuickCapture } from "./_components/quick-capture";

/**
 * Layout do Shell — Sprint 1, estilo Sprint 25.
 *
 * Envolve todos os módulos da Navegação Global (UI_UX.md, seção 4).
 * "/login" fica fora deste grupo de rotas propositalmente (não deve
 * ter navegação — INTERACTION_MODEL.md, seção 2).
 *
 * Responsivo sem JavaScript: sidebar fixa à esquerda a partir de
 * `md`; abaixo disso, os mesmos itens (mesmo `GlobalNavigation`,
 * `orientation="horizontal"`) viram uma barra rolável no topo — sem
 * estado de abrir/fechar, sem duplicar a lista de navegação.
 */
export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 md:flex">
      <aside className="hidden shrink-0 border-r border-zinc-200 bg-white md:flex md:w-60 md:flex-col md:justify-between md:p-4">
        <div>
          <p className="mb-6 px-3 text-sm font-semibold text-zinc-900">SEPosicionaVictor</p>
          <GlobalNavigation />
        </div>
        <div className="flex flex-col gap-2 px-3">
          <QuickCapture />
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
          <p className="text-sm font-semibold text-zinc-900">SEPosicionaVictor</p>
          <div className="flex items-center gap-2">
            <QuickCapture />
            <SignOutButton />
          </div>
        </header>
        <div className="border-b border-zinc-200 bg-white px-4 py-2 md:hidden">
          <GlobalNavigation orientation="horizontal" />
        </div>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
