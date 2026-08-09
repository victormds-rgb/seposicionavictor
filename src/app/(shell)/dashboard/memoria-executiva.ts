/**
 * Sprint 39 (Memória Executiva REAL do MeuCMO) — substitui a versão
 * da Sprint 38, que reapresentava o estado atual ("alertasAtivos",
 * "pendenciasInbox" etc.) como se fossem novidades, sem nenhuma
 * comparação real contra uma visita anterior.
 *
 * Função pura de apresentação (não é Use Case — não acessa
 * repositório, não tem regra de negócio, só compara datas já
 * carregadas pelo Dashboard contra um ponto de referência). Mantida
 * fora do Domain/Application de propósito: nenhum Bounded Context
 * precisa saber que "última visita" existe.
 *
 * Escopo desta sprint (3 categorias — as mesmas que o enunciado pediu
 * como exemplo de saída):
 * - Alertas: comparado por `dataDisparo` (já existe no domínio de
 *   Alerta, nunca é tocado depois da criação — Sprint 29 confirmou).
 * - Inbox: comparado por `dataCaptura` (já existe no domínio de
 *   RegistroBruto, nunca é tocado depois da captura).
 * - Projetos prontos para Case: comparado por `criadoEm` (campo novo
 *   no domínio de Projeto, ver justificativa em
 *   src/projetos/domain/projeto.ts).
 *
 * Ficam de fora (ver relatório da Sprint 39 para a justificativa
 * completa): Agenda (não pedida na lista de exemplos desta sprint) e
 * Distribuição de Pilares (dado computado/agregado, sem timestamp de
 * entidade comparável — comparar exigiria guardar um snapshot
 * numérico anterior, que a sprint proibiu).
 */

export interface EntradaMemoriaExecutiva {
  /** `null` = primeira visita real (nunca houve uma anterior). */
  ultimaVisitaEm: Date | null;
  alertas: { dataDisparo: Date }[];
  registrosInbox: { dataCaptura: Date }[];
  projetosProntosParaCase: { criadoEm: Date }[];
}

/**
 * Retorna as frases de mudança REAL desde `ultimaVisitaEm`. Array
 * vazio em dois cenários distintos (o chamador decide a copy exibida
 * para cada um — `ultimaVisitaEm === null` vs. mudanças === []):
 * primeira visita (sem baseline para comparar) ou visita real sem
 * nenhuma mudança detectável.
 */
export function calcularMudancasDesdeUltimaVisita(
  entrada: EntradaMemoriaExecutiva
): string[] {
  if (!entrada.ultimaVisitaEm) return [];
  const referencia = entrada.ultimaVisitaEm;

  const mudancas: string[] = [];

  const alertasNovos = entrada.alertas.filter((a) => a.dataDisparo > referencia);
  if (alertasNovos.length > 0) {
    mudancas.push(
      alertasNovos.length === 1
        ? "1 alerta novo desde sua última visita."
        : `${alertasNovos.length} alertas novos desde sua última visita.`
    );
  }

  const registrosNovos = entrada.registrosInbox.filter((r) => r.dataCaptura > referencia);
  if (registrosNovos.length > 0) {
    mudancas.push(
      registrosNovos.length === 1
        ? "1 novo registro chegou à Inbox."
        : `${registrosNovos.length} novos registros chegaram à Inbox.`
    );
  }

  const projetosNovos = entrada.projetosProntosParaCase.filter((p) => p.criadoEm > referencia);
  if (projetosNovos.length > 0) {
    mudancas.push(
      projetosNovos.length === 1
        ? "Um Projeto ficou pronto para virar Case."
        : `${projetosNovos.length} Projetos ficaram prontos para virar Case.`
    );
  }

  return mudancas;
}

/**
 * Lê `ultimaVisitaEm` de `user_metadata` (Supabase Auth) de forma
 * defensiva — nunca confia cegamente no formato armazenado.
 */
export function interpretarUltimaVisita(valor: unknown): Date | null {
  if (typeof valor !== "string") return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}
