"use client";

import { useEffect, useRef, useState } from "react";
import {
  capturarTextoAction,
  capturarArquivoAction,
} from "../inbox/actions";
import { SubmitButton } from "./submit-button";

/**
 * Quick Capture — INTERACTION_MODEL.md, seção 4.
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

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()}>
        Capturar (Q)
      </button>

      <dialog ref={dialogRef} aria-label="Quick Capture">
        <button type="button" onClick={fechar} aria-label="Fechar">
          Esc / Fechar
        </button>

        <div role="tablist" aria-label="Tipo de captura">
          <button type="button" onClick={() => setModo("texto")} aria-pressed={modo === "texto"}>
            Texto / Observação / Link
          </button>
          <button type="button" onClick={() => setModo("arquivo")} aria-pressed={modo === "arquivo"}>
            Áudio / Imagem / Arquivo
          </button>
        </div>

        {modo === "texto" && (
          <form
            action={async (formData) => {
              await capturarTextoAction(formData);
              fechar();
            }}
          >
            <label>
              Tipo
              <select name="tipoEntrada" defaultValue="texto">
                <option value="texto">Texto</option>
                <option value="observacao">Observação</option>
                <option value="mensagem">Mensagem</option>
                <option value="link">Link</option>
                <option value="email">E-mail (colado)</option>
              </select>
            </label>
            <label>
              Origem
              <select name="origem" defaultValue="ideia">
                <option value="ideia">Ideia</option>
                <option value="aprendizado">Aprendizado</option>
                <option value="reuniao">Reunião</option>
                <option value="outro">Outro</option>
              </select>
            </label>
            <textarea name="conteudoTexto" autoFocus required placeholder="O que você quer registrar?" />
            <SubmitButton>Capturar</SubmitButton>
          </form>
        )}

        {modo === "arquivo" && (
          <form
            action={async (formData) => {
              await capturarArquivoAction(formData);
              fechar();
            }}
          >
            <label>
              Tipo
              <select name="tipoEntrada" defaultValue="audio">
                <option value="audio">Áudio</option>
                <option value="imagem">Imagem</option>
                <option value="pdf">PDF</option>
                <option value="print">Print</option>
                <option value="documento">Documento</option>
              </select>
            </label>
            <label>
              Origem
              <select name="origem" defaultValue="ideia">
                <option value="ideia">Ideia</option>
                <option value="aprendizado">Aprendizado</option>
                <option value="reuniao">Reunião</option>
                <option value="outro">Outro</option>
              </select>
            </label>
            <input type="file" name="arquivo" required />
            <SubmitButton>Capturar</SubmitButton>
          </form>
        )}
      </dialog>
    </>
  );
}
