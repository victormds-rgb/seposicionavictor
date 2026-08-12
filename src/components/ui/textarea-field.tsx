import type { TextareaHTMLAttributes } from "react";
import { FormField } from "./form-field";
import { Textarea } from "./textarea";

/**
 * TextareaField — FormField + Textarea combinados (Sprint 27; suporte
 * a `help`/`error` na Sprint de UX/UI). Mesmo raciocínio de
 * SelectField: o par se repetia idêntico em Pipeline, Projetos e
 * Conteúdo.
 */
export function TextareaField({
  label,
  help,
  error,
  ...props
}: { label: string; help?: string; error?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FormField label={label} help={help} error={error}>
      <Textarea {...props} />
    </FormField>
  );
}
