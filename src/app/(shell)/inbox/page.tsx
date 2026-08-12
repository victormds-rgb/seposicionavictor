import { listarRegistrosBrutos } from "@/inbox/application/listar-registros-brutos";
import { criarDependenciasDaInbox } from "@/inbox/infrastructure/composicao";
import type {
  StatusRegistroBruto,
  TipoEntrada,
  OrigemRegistro,
} from "@/inbox/domain/registro-bruto";
import { TIPOS_DESTINO } from "@/shared/enums/tipo-destino";
import {
  responderSugestaoAction,
  solicitarNovaSugestaoAction,
  descartarRegistroBrutoAction,
  classificarManualmenteAction,
} from "./actions";
import { CapturaForm } from "./_components/captura-form";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

/**
 * Inbox Universal — Sprint 2, redesenhada na Sprint de UX/UI (Fase 5
 * — prioridade alta: a captura estava um formulário administrativo
 * cru, sem nenhum agrupamento visual).
 *
 * Fluxo completo inalterado: captura (texto/arquivo) → sugestão de IA
 * → confirmação humana (aceitar/editar/rejeitar) → destino registrado.
 * Busca e filtros via query string (UI_UX.md, seção 6;
 * INTERACTION_MODEL.md, seção 5).
 */

// Mapeamento puro de apresentação (Sprint 33.5 — Refinamento): os
// valores de status/tipoDestino são identificadores internos
// (snake_case) — antes apareciam crus na tela ("classificacao_sugerida",
// "build_log"). Não muda nenhum valor armazenado nem enviado ao
// Server Action, só o texto exibido.
const ROTULOS_STATUS_REGISTRO: Record<StatusRegistroBruto, string> = {
  capturado: "Capturado",
  em_processamento: "Em processamento",
  classificacao_sugerida: "Sugestão da IA",
  classificado: "Classificado",
  descartado: "Descartado",
};

function variantDoStatusRegistro(status: StatusRegistroBruto): "neutral" | "info" | "warning" | "success" {
  if (status === "classificado") return "success";
  if (status === "classificacao_sugerida") return "info";
  if (status === "em_processamento") return "warning";
  return "neutral";
}

const ROTULOS_TIPO_DESTINO: Record<(typeof TIPOS_DESTINO)[number], string> = {
  projeto: "Projeto",
  build_log: "Build Log",
  peca_conteudo: "Peça de Conteúdo",
  tarefa: "Tarefa",
  ativo_conhecimento: "Ativo de Conhecimento",
};

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    tipoEntrada?: string;
    origem?: string;
    busca?: string;
    reuniaoId?: string;
    erro?: string;
  }>;
}) {
  const params = await searchParams;
  const deps = criarDependenciasDaInbox();

  const registros = await listarRegistrosBrutos(
    {
      status: params.status as StatusRegistroBruto | undefined,
      tipoEntrada: params.tipoEntrada as TipoEntrada | undefined,
      origem: params.origem as OrigemRegistro | undefined,
      textoBusca: params.busca,
    },
    { registroBrutoRepository: deps.registroBrutoRepository }
  );

  const registrosComSugestao = await Promise.all(
    registros.map(async (registro) => {
      const sugestaoPendente =
        registro.status === "classificacao_sugerida"
          ? await deps.sugestaoIARepository.buscarPendentePorRegistroOrigem(registro.id)
          : null;

      const ultimaSugestaoRejeitada =
        !sugestaoPendente && registro.status === "classificacao_sugerida"
          ? await deps.sugestaoIARepository.buscarMaisRecentePorRegistroOrigem(registro.id)
          : null;

      return { registro, sugestaoPendente, ultimaSugestaoRejeitada };
    })
  );

  // Uma entrada "precisa de decisão" (fica sempre visível, sem
  // colapsar) quando ainda há algo para Victor fazer; o resto
  // (classificado/descartado, sem sugestão pendente) já foi resolvido
  // e só precisa ficar escaneável, não em destaque.
  function precisaDeDecisao(status: StatusRegistroBruto): boolean {
    return status !== "classificado" && status !== "descartado";
  }

  return (
    <div>
      <PageHeader
        title="Inbox"
        description="Capture qualquer coisa e deixe a IA sugerir para onde vai — você sempre decide."
      />

      <div className="space-y-6">
        <Section title="Capturar nova entrada">
          <CapturaForm reuniaoId={params.reuniaoId} />
        </Section>

        <Section
          title={`Registros (${registrosComSugestao.length})`}
          action={
            <form className="flex flex-wrap items-end gap-2">
              <FormField label="Status">
                <Select name="status" defaultValue={params.status ?? ""} className="w-40">
                  <option value="">Todos</option>
                  <option value="capturado">Capturado</option>
                  <option value="em_processamento">Em processamento</option>
                  <option value="classificacao_sugerida">Sugestão da IA</option>
                  <option value="classificado">Classificado</option>
                  <option value="descartado">Descartado</option>
                </Select>
              </FormField>
              <FormField label="Busca">
                <Input type="text" name="busca" defaultValue={params.busca ?? ""} className="w-40" />
              </FormField>
              <Button type="submit" variant="secondary">
                Filtrar
              </Button>
            </form>
          }
        >
          {params.erro && (
            <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {params.erro}
            </p>
          )}

          {registrosComSugestao.length === 0 && (
            <EmptyState message="Nenhum registro encontrado — Inbox em dia." />
          )}

          <ul className="space-y-3">
            {registrosComSugestao.map(({ registro, sugestaoPendente, ultimaSugestaoRejeitada }) => {
              const emAberto = precisaDeDecisao(registro.status);

              return (
                <li key={registro.id}>
                  <Card className="p-4 shadow-none">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="max-w-2xl text-sm text-zinc-900 line-clamp-2">
                        {registro.conteudoTexto ?? "(arquivo — sem prévia de texto)"}
                      </p>
                      <Badge variant={variantDoStatusRegistro(registro.status)}>
                        {ROTULOS_STATUS_REGISTRO[registro.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {registro.tipoEntrada} · {registro.origem} ·{" "}
                      {registro.dataCaptura.toLocaleDateString("pt-BR")}
                    </p>

                    {sugestaoPendente && (
                      <div className="mt-3 rounded-md bg-blue-50 p-3">
                        <p className="text-sm text-zinc-800">
                          IA sugere:{" "}
                          <strong className="font-medium">
                            {(() => {
                              const tipo = (
                                sugestaoPendente.conteudoSugerido as { tipoDestinoSugerido?: string }
                              ).tipoDestinoSugerido;
                              return tipo && tipo in ROTULOS_TIPO_DESTINO
                                ? ROTULOS_TIPO_DESTINO[tipo as keyof typeof ROTULOS_TIPO_DESTINO]
                                : tipo;
                            })()}
                          </strong>{" "}
                          — {(sugestaoPendente.conteudoSugerido as { justificativa?: string }).justificativa}
                          {sugestaoPendente.confianca !== null &&
                            ` (confiança: ${sugestaoPendente.confianca})`}
                        </p>

                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-zinc-500">
                            Como a IA chegou nessa sugestão?
                          </summary>
                          <ul className="mt-1 space-y-0.5 text-xs text-zinc-500">
                            <li>Provider: {sugestaoPendente.provider ?? "—"}</li>
                            <li>Modelo: {sugestaoPendente.modelo ?? "—"}</li>
                            <li>Versão do prompt: {sugestaoPendente.promptVersion ?? "—"}</li>
                            <li>
                              Tokens (entrada/saída): {sugestaoPendente.tokensInput ?? "—"}/
                              {sugestaoPendente.tokensOutput ?? "—"}
                            </li>
                            <li>Custo estimado: {sugestaoPendente.custoEstimado ?? "—"}</li>
                            <li>Tempo de resposta: {sugestaoPendente.tempoRespostaMs ?? "—"}ms</li>
                          </ul>
                        </details>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <form action={responderSugestaoAction}>
                            <input type="hidden" name="sugestaoId" value={sugestaoPendente.id} />
                            <input type="hidden" name="decisao" value="aceitar" />
                            <Button type="submit">Aceitar</Button>
                          </form>

                          <form
                            action={responderSugestaoAction}
                            className="flex items-center gap-2"
                          >
                            <input type="hidden" name="sugestaoId" value={sugestaoPendente.id} />
                            <input type="hidden" name="decisao" value="editar" />
                            <Select name="tipoDestinoEscolhido" className="w-40">
                              {TIPOS_DESTINO.map((tipo) => (
                                <option key={tipo} value={tipo}>
                                  {ROTULOS_TIPO_DESTINO[tipo]}
                                </option>
                              ))}
                            </Select>
                            <Button type="submit" variant="secondary">
                              Editar e confirmar
                            </Button>
                          </form>

                          <form action={responderSugestaoAction}>
                            <input type="hidden" name="sugestaoId" value={sugestaoPendente.id} />
                            <input type="hidden" name="decisao" value="rejeitar" />
                            <Button type="submit" variant="destructive">
                              Rejeitar
                            </Button>
                          </form>
                        </div>
                      </div>
                    )}

                    {!sugestaoPendente &&
                      (registro.status === "capturado" ||
                        registro.status === "classificacao_sugerida") && (
                        <form
                          action={classificarManualmenteAction}
                          className="mt-3 flex flex-wrap items-center gap-2"
                        >
                          <input type="hidden" name="registroBrutoId" value={registro.id} />
                          <span className="text-sm text-zinc-600">Classificar manualmente para</span>
                          <Select name="tipoDestinoEscolhido" className="w-40">
                            {TIPOS_DESTINO.map((tipo) => (
                              <option key={tipo} value={tipo}>
                                {ROTULOS_TIPO_DESTINO[tipo]}
                              </option>
                            ))}
                          </Select>
                          <Button type="submit" variant="secondary">
                            Confirmar destino
                          </Button>
                        </form>
                      )}

                    {ultimaSugestaoRejeitada && ultimaSugestaoRejeitada.status === "rejeitada" && (
                      <form action={solicitarNovaSugestaoAction} className="mt-3">
                        <input type="hidden" name="sugestaoId" value={ultimaSugestaoRejeitada.id} />
                        <Button type="submit" variant="secondary">
                          Solicitar nova sugestão
                        </Button>
                      </form>
                    )}

                    {emAberto && (
                      <form action={descartarRegistroBrutoAction} className="mt-3">
                        <input type="hidden" name="registroBrutoId" value={registro.id} />
                        <Button type="submit" variant="ghost">
                          Descartar
                        </Button>
                      </form>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        </Section>
      </div>
    </div>
  );
}
