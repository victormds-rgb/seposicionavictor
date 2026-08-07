import type { SelectHTMLAttributes } from "react";
import { FormField } from "./form-field";
import { Select } from "./select";

/**
 * SelectField — FormField + Select combinados (Sprint 27). O par
 * `<FormField label="X"><Select .../></FormField>` se repetia
 * idêntico em Pipeline, Projetos e Conteúdo — não conhece regra de
 * negócio, só recebe props e repassa para Select.
 */
export function SelectField({
  label,
  ...props
}: { label: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FormField label={label}>
      <Select {...props} />
    </FormField>
  );
}
