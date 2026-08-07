"use client";

import { useEffect, useRef, useState } from "react";
import {
  capturarTextoAction,
  capturarArquivoAction,
} from "../inbox/actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";

/**
 * Quick Capture — INTERACTION_MODEL.md, seção 4. Estilo Sprint 25.
 *
 * Disponível em qualquer tela do Shell (renderizado uma única vez no
 * layout), nunca interrompe o fluxo atual: abre como uma camada leve
 * por cima da tela atual e, ao fechar, devolve o foco exatamente para
 * onde Victor estava.
 *
 * Atalho `Q` (INTERACTION_MODEL.md, seção 6) abre a captura de texto.
 */
export function QuickCapture() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [modo, setModo] = useState<"texto" | "arquivo">("texto");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const alvo = event.target as HTMLElement | null;
      const emCampoDeTexto =
        alvo?.tagName === "INPUT" || alvo?.tagName === "TEXTAREA" || alvo?.isContentEditable;

      if (event.key.toLowerCase() === "q" && !emCampoDeTexto) {
        event.preventDefault();
        dialogRef.current?.showModal();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function fechar() {
    dialogRef.current?.close();
  }

  const tabBase = "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
  const tabActive = "bg-zinc-900 text-white";
  const tabInactive = "text-zinc-600 hover:bg-zinc-100";

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => dialogRef.current?.showModal()}>
        Capturar (Q)
      </Button>

      <dialog
        ref={dialogRef}
        aria-label="Quick Capture"
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg backdrop:bg-zinc-900/40"
      >
        <div className="flex items-center justify-between">
          <div role="tablist" aria-label="Tipo de captura" className="flex gap-1">
            <button
              type="button"
              onClick={() => setModo("texto")}
              aria-pressed={modo === "texto"}
              className={`${tabBase} ${modo === "texto" ? tabActive : tabInactive}`}
            >
              Texto
            </button>
            <button
              type="button"
              onClick={() => setModo("arquivo")}
              aria-pressed={modo === "arquivo"}
              className={`${tabBase} ${modo === "arquivo" ? tabActive : tabInactive}`}
            >
              Arquivo
            </button>
          </div>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            Esc / Fechar
          </button>
        </div>

        {modo === "texto" && (
          <form
            action={async (formData) => {
              await capturarTextoAction(formData);
              fechar();
            }}
            className="mt-4 space-y-4"
          >
            <FormField label="Tipo">
              <Select name="tipoEntrada" defaultValue="texto">
                <option value="texto">Texto</option>
                <option value="observacao">Observação</option>
                <option value="mensagem">Mensagem</option>
                <option value="link">Link</option>
                <option value="email">E-mail (colado)</option>
              </Select>
            </FormField>
            <FormField label="Origem">
              <Select name="origem" defaultValue="ideia">
                <option value="ideia">Ideia</option>
                <option value="aprendizado">Aprendizado</option>
                <option value="reuniao">Reunião</option>
                <option value="outro">Outro</option>
              </Select>
            </FormField>
            <FormField label="Conteúdo">
              <Textarea
                name="conteudoTexto"
                autoFocus
                required
                placeholder="O que você quer registrar?"
                rows={4}
              />
            </FormField>
            <Button type="submit" className="w-full">
              Capturar
            </Button>
          </form>
        )}

        {modo === "arquivo" && (
          <form
            action={async (formData) => {
              await capturarArquivoAction(formData);
              fechar();
            }}
            className="mt-4 space-y-4"
          >
            <FormField label="Tipo">
              <Select name="tipoEntrada" defaultValue="audio">
                <option value="audio">Áudio</option>
                <option value="imagem">Imagem</option>
                <option value="pdf">PDF</option>
                <option value="print">Print</option>
                <option value="documento">Documento</option>
              </Select>
            </FormField>
            <FormField label="Origem">
              <Select name="origem" defaultValue="ideia">
                <option value="ideia">Ideia</option>
                <option value="aprendizado">Aprendizado</option>
                <option value="reuniao">Reunião</option>
                <option value="outro">Outro</option>
              </Select>
            </FormField>
            <FormField label="Arquivo">
              <input
                type="file"
                name="arquivo"
                required
                className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-200"
              />
            </FormField>
            <Button type="submit" className="w-full">
              Capturar
            </Button>
          </form>
        )}
      </dialog>
    </>
  );
}
