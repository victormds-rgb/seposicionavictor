import { listarRegistrosBrutos } from "@/inbox/application/listar-registros-brutos";
import { criarDependenciasDaInbox } from "@/inbox/infrastructure/composicao";
import type {
  StatusRegistroBruto,
  TipoEntrada,
  OrigemRegistro,
} from "@/inbox/domain/registro-bruto";
import { TIPOS_DESTINO } from "@/shared/enums/tipo-destino";
import {
  capturarTextoAction,
  capturarArquivoAction,
  responderSugestaoAction,
  solicitarNovaSugestaoAction,
  descartarRegistroBrutoAction,
} from "./actions";
import { SubmitButton } from "../_components/submit-button";

/**
 * Inbox Universal — Sprint 2.
 *
 * Fluxo completo: captura (texto/arquivo) → sugestão de IA →
 * confirmação humana (aceitar/editar/rejeitar) → destino registrado.
 * Busca e filtros via query string (UI_UX.md, seção 6;
 * INTERACTION_MODEL.md, seção 5).
 */
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

  return (
    <div>
      <h1>Inbox</h1>

      <section aria-labelledby="capturar-texto">
        <h2 id="capturar-texto">Capturar (texto)</h2>
        {params.reuniaoId && <p>Associando à reunião {params.reuniaoId}.</p>}
        <form action={capturarTextoAction}>
          {params.reuniaoId && <input type="hidden" name="reuniaoId" value={params.reuniaoId} />}
          <label>
            Tipo de entrada
            <select name="tipoEntrada" defaultValue="texto">
              <option value="texto">Texto</option>
              <option value="observacao">Observação</option>
              <option value="mensagem">Mensagem</option>
              <option value="link">Link</option>
              <option value="email">E-mail (colado)</option>
              <option value="transcricao">Transcrição</option>
            </select>
          </label>
          <label>
            Origem
            <select name="origem" defaultValue="ideia">
              <option value="ideia">Ideia</option>
              <option value="aprendizado">Aprendizado</option>
              <option value="reuniao">Reunião</option>
              <option value="email">E-mail</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="outro">Outro</option>
            </select>
          </label>
          <label>
            Conteúdo
            <textarea name="conteudoTexto" required />
          </label>
          <SubmitButton>Capturar</SubmitButton>
        </form>
      </section>

      <section aria-labelledby="capturar-arquivo">
        <h2 id="capturar-arquivo">Capturar (arquivo)</h2>
        {params.erro ? <p role="alert">{params.erro}</p> : null}
        <form action={capturarArquivoAction}>
          <label>
            Tipo de entrada
            <select name="tipoEntrada" defaultValue="documento">
              <option value="audio">Áudio</option>
              <option value="imagem">Imagem</option>
              <option value="pdf">PDF</option>
              <option value="video">Vídeo</option>
              <option value="print">Print</option>
              <option value="documento">Documento</option>
            </select>
          </label>
          <label>
            Origem
            <select name="origem" defaultValue="ideia">
              <option value="ideia">Ideia</option>
              <option value="aprendizado">Aprendizado</option>
              <option value="reuniao">Reunião</option>
              <option value="outro">Outro</option>
            </select>
          </label>
          <label>
            Arquivo
            <input type="file" name="arquivo" required />
          </label>
          <SubmitButton>Capturar</SubmitButton>
        </form>
      </section>

      <section aria-labelledby="filtros">
        <h2 id="filtros">Filtros</h2>
        <form>
          <label>
            Status
            <select name="status" defaultValue={params.status ?? ""}>
              <option value="">Todos</option>
              <option value="capturado">Capturado</option>
              <option value="em_processamento">Em processamento</option>
              <option value="classificacao_sugerida">Classificação sugerida</option>
              <option value="classificado">Classificado</option>
              <option value="descartado">Descartado</option>
            </select>
          </label>
          <label>
            Busca
            <input type="text" name="busca" defaultValue={params.busca ?? ""} />
          </label>
          <SubmitButton>Filtrar</SubmitButton>
        </form>
      </section>

      <section aria-labelledby="lista-registros">
        <h2 id="lista-registros">Registros ({registrosComSugestao.length})</h2>
        {registrosComSugestao.length === 0 && <p>Nenhum registro encontrado — Inbox em dia.</p>}
        <ul>
          {registrosComSugestao.map(({ registro, sugestaoPendente, ultimaSugestaoRejeitada }) => (
            <li key={registro.id}>
              <p>
                <strong>{registro.tipoEntrada}</strong> · {registro.origem} ·{" "}
                <em>{registro.status}</em>
              </p>
              {registro.conteudoTexto && <p>{registro.conteudoTexto}</p>}

              {sugestaoPendente && (
                <div>
                  <p>
                    IA sugere:{" "}
                    <strong>
                      {(sugestaoPendente.conteudoSugerido as { tipoDestinoSugerido?: string })
                        .tipoDestinoSugerido}
                    </strong>{" "}
                    — {(sugestaoPendente.conteudoSugerido as { justificativa?: string }).justificativa}
                    {sugestaoPendente.confianca !== null &&
                      ` (confiança: ${sugestaoPendente.confianca})`}
                  </p>

                  <details>
                    <summary>Como a IA chegou nessa sugestão?</summary>
                    <ul>
                      <li>Provider: {sugestaoPendente.provider ?? "—"}</li>
                      <li>Modelo: {sugestaoPendente.modelo ?? "—"}</li>
                      <li>Versão do prompt: {sugestaoPendente.promptVersion ?? "—"}</li>
                      <li>Tokens (entrada/saída): {sugestaoPendente.tokensInput ?? "—"}/{sugestaoPendente.tokensOutput ?? "—"}</li>
                      <li>Custo estimado: {sugestaoPendente.custoEstimado ?? "—"}</li>
                      <li>Tempo de resposta: {sugestaoPendente.tempoRespostaMs ?? "—"}ms</li>
                    </ul>
                  </details>

                  <form action={responderSugestaoAction}>
                    <input type="hidden" name="sugestaoId" value={sugestaoPendente.id} />
                    <input type="hidden" name="decisao" value="aceitar" />
                    <SubmitButton>Aceitar</SubmitButton>
                  </form>

                  <form action={responderSugestaoAction}>
                    <input type="hidden" name="sugestaoId" value={sugestaoPendente.id} />
                    <input type="hidden" name="decisao" value="editar" />
                    <label>
                      Corrigir para
                      <select name="tipoDestinoEscolhido">
                        {TIPOS_DESTINO.map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {tipo}
                          </option>
                        ))}
                      </select>
                    </label>
                    <SubmitButton>Editar e confirmar</SubmitButton>
                  </form>

                  <form action={responderSugestaoAction}>
                    <input type="hidden" name="sugestaoId" value={sugestaoPendente.id} />
                    <input type="hidden" name="decisao" value="rejeitar" />
                    <SubmitButton>Rejeitar</SubmitButton>
                  </form>
                </div>
              )}

              {ultimaSugestaoRejeitada && ultimaSugestaoRejeitada.status === "rejeitada" && (
                <form action={solicitarNovaSugestaoAction}>
                  <input type="hidden" name="sugestaoId" value={ultimaSugestaoRejeitada.id} />
                  <SubmitButton>Solicitar nova sugestão</SubmitButton>
                </form>
              )}

              {registro.status !== "classificado" && registro.status !== "descartado" && (
                <form action={descartarRegistroBrutoAction}>
                  <input type="hidden" name="registroBrutoId" value={registro.id} />
                  <SubmitButton>Descartar</SubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
