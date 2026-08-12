"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Avatar } from "@/components/ui/avatar";
import { GlobalNavigation } from "./global-navigation";
import { QuickCapture } from "./quick-capture";
import { SignOutButton } from "./sign-out-button";

/**
 * Navegação mobile — Checkpoint F (App Shell). Substitui a antiga
 * barra horizontal rolável (versão "comprimida" do desktop) por um
 * Drawer com a MESMA navegação agrupada da sidebar — mobile deixa de
 * ser uma versão espremida do desktop, vira sua própria composição
 * coerente (regra explícita do Checkpoint F).
 */
export function NavDrawer({ nomeExibido }: { nomeExibido: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Abrir navegação"
        className="rounded-md p-2 text-ink-secondary transition-colors hover:bg-surface-sunken hover:text-ink-primary md:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <Drawer open={aberto} onClose={() => setAberto(false)} title="FDE" className="max-w-xs">
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto">
            <GlobalNavigation />
          </div>
          <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
            <div className="flex items-center gap-2 px-1">
              <Avatar nome={nomeExibido} size="sm" />
              <p className="truncate text-sm font-medium text-ink-primary">{nomeExibido}</p>
            </div>
            <QuickCapture />
            <SignOutButton />
          </div>
        </div>
      </Drawer>
    </>
  );
}
