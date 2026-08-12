"use client";

import { useState } from "react";
import { capturarTextoAction, capturarArquivoAction } from "../actions";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { FormField } from "@/components/ui/form-field";

/**
 * Captura da Inbox — Sprint de UX/UI, Fase 5. Mesmo padrão de abas
 * Texto/Arquivo que o `QuickCapture` já usa
 * ((shell)/_components/quick-capture.tsx) — mesmas duas Server
 * Actions, mesmos campos, só a composição visual muda (inline na
 * página em vez de dentro de um `<dialog>`), para a Inbox parar de
 * parecer um formulário administrativo cru.
 */
export function CapturaForm({ reuniaoId }: { reuniaoId?: string }) {
  const [modo, setModo] = useState<"texto" | "arquivo">("texto");

  const tabBase = "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
  const tabActive = "bg-zinc-900 text-white";
  const tabInactive = "text-zinc-600 hover:bg-zinc-100";

  return (
    <div>
      <div role="tablist" aria-label="Tipo de captura" className="mb-4 flex gap-1">
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

      {modo === "texto" && (
        <form action={capturarTextoAction} className="max-w-xl space-y-4">
          {reuniaoId && (
            <>
              <input type="hidden" name="reuniaoId" value={reuniaoId} />
              <p className="text-sm text-zinc-500">Associando à reunião {reuniaoId}.</p>
            </>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Tipo de entrada" name="tipoEntrada" defaultValue="texto">
              <option value="texto">Texto</option>
              <option value="observacao">Observação</option>
              <option value="mensagem">Mensagem</option>
              <option value="link">Link</option>
              <option value="email">E-mail (colado)</option>
              <option value="transcricao">Transcrição</option>
            </SelectField>
            <SelectField label="Origem" name="origem" defaultValue="ideia">
              <option value="ideia">Ideia</option>
              <option value="aprendizado">Aprendizado</option>
              <option value="reuniao">Reunião</option>
              <option value="email">E-mail</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="outro">Outro</option>
            </SelectField>
          </div>
          <TextareaField label="Conteúdo" name="conteudoTexto" required rows={4} />
          <Button type="submit">Capturar entrada</Button>
        </form>
      )}

      {modo === "arquivo" && (
        <form action={capturarArquivoAction} className="max-w-xl space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Tipo de entrada" name="tipoEntrada" defaultValue="documento">
              <option value="audio">Áudio</option>
              <option value="imagem">Imagem</option>
              <option value="pdf">PDF</option>
              <option value="video">Vídeo</option>
              <option value="print">Print</option>
              <option value="documento">Documento</option>
            </SelectField>
            <SelectField label="Origem" name="origem" defaultValue="ideia">
              <option value="ideia">Ideia</option>
              <option value="aprendizado">Aprendizado</option>
              <option value="reuniao">Reunião</option>
              <option value="outro">Outro</option>
            </SelectField>
          </div>
          <FormField label="Arquivo" help="Até 10MB.">
            <input
              type="file"
              name="arquivo"
              required
              className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-200"
            />
          </FormField>
          <Button type="submit">Capturar entrada</Button>
        </form>
      )}
    </div>
  );
}
