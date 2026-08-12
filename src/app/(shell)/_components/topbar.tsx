import type { Alerta } from "@/notificacoes/domain/alerta";
import { NavDrawer } from "./nav-drawer";
import { PageContexto } from "./page-contexto";
import { PainelAlertas } from "./painel-alertas";

/**
 * Topbar — Checkpoint F (App Shell), item 4. Não existia no desktop
 * antes desta etapa (achado da auditoria/Fase 0). Deliberadamente
 * mínimo: contexto da página + Alertas. Sem busca — não existe
 * mecanismo de busca no produto hoje, e criar um exigiria indexação
 * cruzada de vários domínios (backend novo), fora do que este
 * Checkpoint autorizou ("busca, se já existir ou puder ser integrada
 * sem criar backend desnecessário" — não existe, então fica de fora).
 * Perfil do usuário fica só no rodapé da sidebar/drawer, para não
 * duplicar o mesmo elemento nos dois lugares.
 */
export function Topbar({ alertas, nomeExibido }: { alertas: Alerta[]; nomeExibido: string }) {
  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-border-subtle bg-surface px-4 md:px-6">
      <div className="flex items-center gap-2">
        <NavDrawer nomeExibido={nomeExibido} />
        <PageContexto />
      </div>
      <PainelAlertas alertas={alertas} />
    </header>
  );
}
