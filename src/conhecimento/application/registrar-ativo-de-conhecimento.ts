import { z } from "zod";
import type { AtivoDeConhecimentoRepository } from "@/conhecimento/domain/conhecimento-repository";
import { TIPOS_ATIVO_CONHECIMENTO } from "@/conhecimento/domain/ativo-de-conhecimento";

const registrarAtivoSchema = z.object({
  tipo: z.enum(TIPOS_ATIVO_CONHECIMENTO),
  conteudoTextual: z.string().trim().min(1),
  origem: z.string().trim().optional(),
});

/**
 * Use Case: registrar um novo item reutilizável de raciocínio
 * (pergunta ou analogia) — SOM Cap. 2.3/2.4, "novos itens podem ser
 * adicionados quando surgirem em conversas reais" (Cap. 9.6).
 */
export async function registrarAtivoDeConhecimento(
  inputBruto: unknown,
  deps: { ativoDeConhecimentoRepository: AtivoDeConhecimentoRepository }
) {
  const input = registrarAtivoSchema.parse(inputBruto);

  return deps.ativoDeConhecimentoRepository.criar({
    tipo: input.tipo,
    conteudoTextual: input.conteudoTextual,
    origem: input.origem ?? null,
    frequenciaUso: 0,
    status: "ativo",
  });
}
