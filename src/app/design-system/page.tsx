"use client";

import { useState } from "react";
import {
  Bell,
  Settings,
  Trash2,
  Sparkles,
  Plus,
  LayoutDashboard,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Drawer } from "@/components/ui/drawer";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Tooltip } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { Breadcrumb } from "@/components/ui/breadcrumb";

/**
 * Página de demonstração interna — Fase 2 (Design System FDE),
 * checkpoint D do método pedido: validar tokens + componentes novos
 * juntos, num só lugar, antes de espalhar pelo produto (checkpoint F,
 * ainda não feito).
 *
 * NÃO está na navegação global (`nav-items.ts`) nem foi pensada como
 * funcionalidade do produto — é uma ferramenta de revisão interna,
 * acessível só por URL direta. Considerar remover ou proteger antes
 * de deploy em produção.
 */
export default function DesignSystemPage() {
  return (
    <ToastProvider>
      <DesignSystemContent />
    </ToastProvider>
  );
}

function DesignSystemContent() {
  const [modalAberto, setModalAberto] = useState(false);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const toast = useToast();

  return (
    <main className="mx-auto max-w-5xl space-y-16 px-6 py-12 font-geist text-ink-primary">
      <header className="space-y-2 border-b border-border-subtle pb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          FDE — Design System · Fase 2
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Graphite &amp; Signal</h1>
        <p className="max-w-2xl text-sm text-ink-secondary">
          Página interna de validação — tokens de identidade visual e os componentes novos
          desta fase, lado a lado. Nenhuma das 11 páginas do produto foi alterada ainda; isso
          acontece só depois desta revisão (checkpoint F).
        </p>
      </header>

      {/* Tipografia */}
      <Secao titulo="Tipografia" descricao="Geist (UI/títulos) + Geist Mono (métricas, uso pontual).">
        <div className="space-y-3">
          <p className="text-3xl font-semibold tracking-tight">Título de destaque — 30px/semibold</p>
          <p className="text-2xl font-semibold tracking-tight">Título de página — 24px/semibold</p>
          <p className="text-lg font-semibold">Título de seção — 18px/semibold</p>
          <p className="text-sm font-semibold">Título de card — 14px/semibold</p>
          <p className="text-sm text-ink-secondary">Corpo — 14px/regular, para leitura contínua.</p>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-tertiary">
            Label — 12px/medium/uppercase
          </p>
          <p className="text-xs text-ink-tertiary">Caption — 12px, para metadados discretos.</p>
          <p className="font-geist-mono text-2xl font-medium tabular-nums">R$ 42.500,00 · #A8F2</p>
        </div>
      </Secao>

      {/* Cor */}
      <Secao titulo="Cor" descricao="Primária estrutural + accent raro (atenção/discovery) + semânticas.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          <Swatch nome="Primary" classe="bg-primary" texto="text-primary-foreground" />
          <Swatch nome="Accent" classe="bg-accent" texto="text-accent-foreground" />
          <Swatch nome="Success" classe="bg-success" texto="text-success-foreground" />
          <Swatch nome="Warning" classe="bg-warning" texto="text-warning-foreground" />
          <Swatch nome="Danger" classe="bg-danger" texto="text-danger-foreground" />
          <Swatch nome="Info" classe="bg-info" texto="text-info-foreground" />
        </div>
      </Secao>

      {/* Raio e sombra */}
      <Secao titulo="Raio &amp; Profundidade" descricao="Escala com intenção — Cards em repouso não têm sombra.">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex size-20 items-center justify-center rounded-sm border border-border-default text-xs text-ink-tertiary">
            sm · 6px
          </div>
          <div className="flex size-20 items-center justify-center rounded-md border border-border-default text-xs text-ink-tertiary">
            md · 10px
          </div>
          <div className="flex size-20 items-center justify-center rounded-lg border border-border-default text-xs text-ink-tertiary">
            lg · 16px
          </div>
          <div className="flex size-20 items-center justify-center rounded-lg bg-surface text-xs text-ink-tertiary shadow-elevated">
            elevated
          </div>
        </div>
      </Secao>

      {/* Botões — prévia do novo padrão (não é o Button.tsx compartilhado) */}
      <Secao
        titulo="Botões — prévia"
        descricao="Ilustrativo: mostra o novo padrão sem alterar o componente Button.tsx real ainda."
      >
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
            Ação primária
          </button>
          <button className="rounded-md border border-border-default bg-surface px-4 py-2 text-sm font-medium text-ink-primary transition-colors hover:bg-surface-sunken">
            Ação secundária
          </button>
          <button className="rounded-md px-4 py-2 text-sm font-medium text-ink-tertiary transition-colors hover:bg-surface-sunken hover:text-ink-primary">
            Ação discreta
          </button>
          <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-4" aria-hidden="true" /> Novo / discovery
            </span>
          </button>
        </div>
      </Secao>

      {/* Componentes novos */}
      <Secao titulo="Modal" descricao="Generaliza o <dialog> nativo já usado pelo Quick Capture.">
        <button
          onClick={() => setModalAberto(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Abrir modal
        </button>
        <Modal
          open={modalAberto}
          onClose={() => setModalAberto(false)}
          title="Novo Projeto"
          description="Exemplo de conteúdo dentro do Modal."
        >
          <p className="text-sm text-ink-secondary">
            Qualquer formulário ou conteúdo pode viver aqui — mesmo padrão de foco preso e Esc
            que o Quick Capture já usava.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setModalAberto(false)}
              className="rounded-md border border-border-default px-3 py-1.5 text-sm font-medium hover:bg-surface-sunken"
            >
              Cancelar
            </button>
            <button
              onClick={() => setModalAberto(false)}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Confirmar
            </button>
          </div>
        </Modal>
      </Secao>

      <Secao titulo="Drawer" descricao="Mesma base do Modal, deslizando da direita — detalhe sem sair da lista.">
        <button
          onClick={() => setDrawerAberto(true)}
          className="rounded-md border border-border-default bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-sunken"
        >
          Abrir drawer
        </button>
        <Drawer open={drawerAberto} onClose={() => setDrawerAberto(false)} title="Detalhe do Lead">
          <p className="text-sm text-ink-secondary">Conteúdo de detalhe, sem navegar para outra página.</p>
        </Drawer>
      </Secao>

      <Secao titulo="Dropdown" descricao="Popover API nativa — sem listener de clique-fora escrito à mão.">
        <Dropdown
          trigger={
            <button className="inline-flex items-center gap-2 rounded-md border border-border-default bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-sunken">
              <Settings className="size-4" aria-hidden="true" />
              Ações
            </button>
          }
        >
          <DropdownItem icon={LayoutDashboard}>Ver detalhes</DropdownItem>
          <DropdownItem icon={Plus}>Duplicar</DropdownItem>
          <DropdownItem icon={Trash2} danger>
            Excluir
          </DropdownItem>
        </Dropdown>
      </Secao>

      <Secao titulo="Toast" descricao="Feedback de produto para ações importantes (Fase 8 do redesign).">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => toast({ title: "Primeiro cliente cadastrado", variant: "success" })}
            className="rounded-md border border-border-default px-3 py-1.5 text-sm font-medium hover:bg-surface-sunken"
          >
            Disparar sucesso
          </button>
          <button
            onClick={() =>
              toast({ title: "Existem projetos sem responsável", description: "3 itens precisam de atenção.", variant: "warning" })
            }
            className="rounded-md border border-border-default px-3 py-1.5 text-sm font-medium hover:bg-surface-sunken"
          >
            Disparar aviso
          </button>
        </div>
      </Secao>

      <Secao titulo="Skeleton" descricao="Placeholder de carregamento — só onde já existe loading real.">
        <div className="max-w-sm space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Secao>

      <Secao titulo="Pagination" descricao="Prioridade real: aplicar em Conteúdo (1151 itens) e Projetos (215) antes de mais peso visual.">
        <Pagination page={3} totalPages={12} buildHref={(p) => `#pagina-${p}`} className="max-w-md" />
      </Secao>

      <Secao titulo="Tooltip" descricao="CSS puro (group-hover/group-focus-within), sem lib de posicionamento.">
        <Tooltip label="Reconhecer este alerta">
          <button className="rounded-md border border-border-default p-2 hover:bg-surface-sunken">
            <Bell className="size-4" aria-hidden="true" />
          </button>
        </Tooltip>
      </Secao>

      <Secao titulo="Progress" descricao="Uso previsto: barra de etapas do onboarding.">
        <Progress value={2} max={3} label="Etapa 2 de 3" className="max-w-sm" />
      </Secao>

      <Secao titulo="Avatar" descricao="Iniciais como fallback quando não há foto.">
        <div className="flex items-center gap-3">
          <Avatar nome="Victor Sousa" size="sm" />
          <Avatar nome="Victor Sousa" size="md" />
          <Avatar nome="Victor Sousa" size="lg" />
        </div>
      </Secao>

      <Secao titulo="Breadcrumb" descricao="Wayfinding — uso previsto em telas de detalhe.">
        <Breadcrumb items={[{ label: "Projetos", href: "#" }, { label: "Case do salão de beleza" }]} />
      </Secao>
    </main>
  );
}

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{titulo}</h2>
        <p className="text-sm text-ink-tertiary">{descricao}</p>
      </div>
      {children}
    </section>
  );
}

function Swatch({ nome, classe, texto }: { nome: string; classe: string; texto: string }) {
  return (
    <div className={`flex h-16 flex-col justify-between rounded-md p-3 ${classe} ${texto}`}>
      <span className="text-xs font-medium">{nome}</span>
    </div>
  );
}
