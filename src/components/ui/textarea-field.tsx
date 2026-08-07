import type { TextareaHTMLAttributes } from "react";
import { FormField } from "./form-field";
import { Textarea } from "./textarea";

/**
 * TextareaField — FormField + Textarea combinados (Sprint 27). Mesmo
 * raciocínio de SelectField: o par se repetia idêntico em Pipeline,
 * Projetos e Conteúdo.
 */
export function TextareaField({
  label,
  ...props
}: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FormField label={label}>
      <Textarea {...props} />
    </FormField>
  );
}
