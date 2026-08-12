import type { SelectHTMLAttributes } from "react";
import { FormField } from "./form-field";
import { Select } from "./select";

/**
 * SelectField — FormField + Select combinados (Sprint 27; suporte a
 * `help`/`error` na Sprint de UX/UI). O par `<FormField label="X">
 * <Select .../></FormField>` se repetia idêntico em Pipeline, Projetos
 * e Conteúdo — não conhece regra de negócio, só recebe props e
 * repassa para Select.
 */
export function SelectField({
  label,
  help,
  error,
  ...props
}: { label: string; help?: string; error?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FormField label={label} help={help} error={error}>
      <Select {...props} />
    </FormField>
  );
}
