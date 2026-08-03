/**
 * Navegação Global — Sprint 1 (Shell).
 *
 * Espelha fielmente UI_UX.md, seção 4, e as URLs conceituais de
 * INFORMATION_ARCHITECTURE.md, seção 9. Nenhum item aqui deve ser
 * adicionado sem antes constar nesses dois documentos.
 *
 * "Missões" não está incluído — pertence à Arquitetura Evolutiva
 * (ARCHITECTURE.md, seção 27) e não existe nesta versão (v1.0).
 */
export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Inbox", href: "/inbox" },
  { label: "Agenda", href: "/agenda" },
  { label: "Pipeline Comercial", href: "/pipeline" },
  { label: "Clientes", href: "/clientes" },
  { label: "Projetos", href: "/projetos" },
  { label: "Conteúdo", href: "/conteudo" },
  { label: "Conhecimento", href: "/conhecimento" },
  { label: "Brand Intelligence", href: "/brand-intelligence" },
  { label: "Configurações", href: "/configuracoes" },
];
