import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Inbox,
  Calendar,
  FileText,
  Sparkles,
  BookOpen,
  FolderKanban,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

/**
 * Navegação Global — Sprint 1 (Shell); reorganizada em grupos e com
 * ícones na Sprint de UX/UI (Fase 2 — Layout Global).
 *
 * Espelha fielmente UI_UX.md, seção 4, e as URLs conceituais de
 * INFORMATION_ARCHITECTURE.md, seção 9. Nenhuma rota nova foi criada
 * aqui — só reorganização visual das rotas que já existem (o
 * agrupamento COMANDO/COMERCIAL/MARKETING/ESTRATÉGIA/SISTEMA pedido
 * na Sprint de UX/UI).
 *
 * "Missões" não está incluído — pertence à Arquitetura Evolutiva
 * (ARCHITECTURE.md, seção 27) e não existe nesta versão (v1.0).
 */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Comando",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Comercial",
    items: [
      { label: "Pipeline Comercial", href: "/pipeline", icon: TrendingUp },
      { label: "Clientes", href: "/clientes", icon: Users },
      { label: "Inbox", href: "/inbox", icon: Inbox },
      { label: "Agenda", href: "/agenda", icon: Calendar },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Conteúdo", href: "/conteudo", icon: FileText },
      { label: "Brand Intelligence", href: "/brand-intelligence", icon: Sparkles },
    ],
  },
  {
    label: "Estratégia",
    items: [
      { label: "Conhecimento", href: "/conhecimento", icon: BookOpen },
      { label: "Projetos", href: "/projetos", icon: FolderKanban },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Alertas", href: "/alertas", icon: Bell },
      { label: "Configurações", href: "/configuracoes", icon: Settings },
    ],
  },
];

/** Lista achatada — usada onde a navegação precisa ser uma linha só (barra mobile). */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);
