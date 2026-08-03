import { GlobalNavigation } from "./_components/global-navigation";
import { SignOutButton } from "./_components/sign-out-button";
import { QuickCapture } from "./_components/quick-capture";

/**
 * Layout do Shell — Sprint 1.
 *
 * Envolve todos os módulos da Navegação Global (UI_UX.md, seção 4).
 * "/login" fica fora deste grupo de rotas propositalmente (não deve
 * ter navegação — INTERACTION_MODEL.md, seção 2).
 *
 * Nenhuma lógica de domínio, Dashboard com dados reais, ou
 * funcionalidade de Inbox/IA é implementada aqui — apenas a casca
 * de navegação (IMPLEMENTATION_PLAN.md, Sprint 1).
 */
export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <header>
        <GlobalNavigation />
        <QuickCapture />
        <SignOutButton />
      </header>
      <main>{children}</main>
    </div>
  );
}
