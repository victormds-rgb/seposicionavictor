import type {
  PecaDeConteudoRepository,
  PilarRepository,
} from "@/conteudo/domain/peca-de-conteudo-repository";

export interface DistribuicaoPilar {
  pilarId: string;
  nome: string;
  pesoAlvoPercentual: number;
  pesoRealPercentual: number;
  totalPublicadas: number;
  desvio: number;
}

/**
 * `CalculadoraDeDistribuicaoDePilares` (ARCHITECTURE.md, seção 7).
 *
 * Decisão D6 (DATABASE.md): o peso real NUNCA é persistido — sempre
 * calculado por consulta agregada em tempo real, a partir das Peças
 * de Conteúdo já publicadas. Evita dessincronização entre dado
 * armazenado e realidade do conteúdo publicado.
 */
export async function calcularDistribuicaoDePilares(
  publicadasDesde: Date | undefined,
  deps: {
    pecaDeConteudoRepository: PecaDeConteudoRepository;
    pilarRepository: PilarRepository;
  }
): Promise<DistribuicaoPilar[]> {
  const pilares = await deps.pilarRepository.listar();
  const contagens = await deps.pecaDeConteudoRepository.contarPublicadasPorPilar(publicadasDesde);

  const totalGeral = contagens.reduce((acc, c) => acc + c.total, 0);

  return pilares.map((pilar) => {
    const contagem = contagens.find((c) => c.pilarId === pilar.id);
    const totalPublicadas = contagem?.total ?? 0;
    const pesoRealPercentual = totalGeral > 0 ? (totalPublicadas / totalGeral) * 100 : 0;

    return {
      pilarId: pilar.id,
      nome: pilar.nome,
      pesoAlvoPercentual: pilar.pesoAlvoPercentual,
      pesoRealPercentual: Math.round(pesoRealPercentual * 100) / 100,
      totalPublicadas,
      desvio: Math.round((pesoRealPercentual - pilar.pesoAlvoPercentual) * 100) / 100,
    };
  });
}
