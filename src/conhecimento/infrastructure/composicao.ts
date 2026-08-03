import { DrizzleFrameworkRepository, DrizzleTemaMapeadoRepository } from "@/conhecimento/infrastructure/framework-e-tema-repository";
import {
  DrizzleAtivoDeConhecimentoRepository,
  DrizzleRegraDeDecisaoRepository,
} from "@/conhecimento/infrastructure/ativo-e-regra-repository";

export function criarDependenciasDeConhecimento() {
  return {
    frameworkRepository: new DrizzleFrameworkRepository(),
    temaMapeadoRepository: new DrizzleTemaMapeadoRepository(),
    ativoDeConhecimentoRepository: new DrizzleAtivoDeConhecimentoRepository(),
    regraDeDecisaoRepository: new DrizzleRegraDeDecisaoRepository(),
  };
}
