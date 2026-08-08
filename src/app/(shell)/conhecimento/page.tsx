import {
  listarFrameworks,
  listarTemasMapeados,
  listarAtivosDeConhecimento,
  listarRegrasDeDecisao,
} from "@/conhecimento/application/consultas";
import { criarDependenciasDeConhecimento } from "@/conhecimento/infrastructure/composicao";
import { registrarAtivoAction } from "./actions";
import { SubmitButton } from "../_components/submit-button";

/**
 * Conhecimento — Sprint 7.
 *
 * Biblioteca de consulta rápida (UI_UX.md, seção 11) — os 4
 * Frameworks, os 12 Temas Mapeados (SOM Cap. 2.5), as 2 Regras de
 * Decisão (Cap. 7.1 e 2.6), e os 9 Ativos de Conhecimento (Cap. 2.3
 * e 2.4). Não é um modo tutorial — é referência rápida.
 */
export const dynamic = "force-dynamic";

// Sprint 33.5 (Refinamento): rótulo legível — antes "conteudo_sem_case"
// aparecia cru.
const ROTULOS_APLICACAO: Record<string, string> = {
  cliente: "Clientes",
  conteudo_sem_case: "Conteúdo sem case",
};

export default async function ConhecimentoPage() {
  const deps = criarDependenciasDeConhecimento();

  const frameworks = await listarFrameworks({ frameworkRepository: deps.frameworkRepository });
  const temas = await listarTemasMapeados({ temaMapeadoRepository: deps.temaMapeadoRepository });
  const ativos = await listarAtivosDeConhecimento(
    {},
    { ativoDeConhecimentoRepository: deps.ativoDeConhecimentoRepository }
  );
  const regras = await listarRegrasDeDecisao({ regraDeDecisaoRepository: deps.regraDeDecisaoRepository });

  const perguntas = ativos.filter((a) => a.tipo === "pergunta_recorrente");
  const analogias = ativos.filter((a) => a.tipo === "analogia");

  return (
    <div>
      <h1>Conhecimento</h1>

      <section aria-labelledby="frameworks">
        <h2 id="frameworks">Frameworks ({frameworks.length})</h2>
        <ul>
          {frameworks.map((f) => (
            <li key={f.id}>
              <strong>{f.nome}</strong>
              <ol>
                {f.estruturaEtapas.map((etapa, i) => (
                  <li key={i}>{etapa}</li>
                ))}
              </ol>
              {f.exemplosUso && <p>{f.exemplosUso}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="temas">
        <h2 id="temas">Temas Mapeados ({temas.length})</h2>
        <ul>
          {temas.map((t) => (
            <li key={t.id}>
              <strong>{t.nomeTema}</strong>:{" "}
              {t.frameworks.length > 0
                ? t.frameworks.map((f) => f.nome).join(", ")
                : "sem framework — usa Perguntas Recorrentes"}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="regras">
        <h2 id="regras">Regras de Decisão ({regras.length})</h2>
        <ul>
          {regras.map((r) => (
            <li key={r.id}>
              <strong>{r.nome}</strong> (aplica-se a: {ROTULOS_APLICACAO[r.aplicaA] ?? r.aplicaA})
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="perguntas">
        <h2 id="perguntas">Banco de Perguntas Recorrentes ({perguntas.length})</h2>
        <ul>
          {perguntas.map((p) => (
            <li key={p.id}>
              {p.conteudoTextual} <em>(usada {p.frequenciaUso} vezes)</em>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="analogias">
        <h2 id="analogias">Banco de Analogias ({analogias.length})</h2>
        <ul>
          {analogias.map((a) => (
            <li key={a.id}>
              {a.conteudoTextual} <em>(usada {a.frequenciaUso} vezes)</em>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="novo-ativo">
        <h2 id="novo-ativo">Registrar novo item</h2>
        <form action={registrarAtivoAction}>
          <label>
            Tipo
            <select name="tipo" defaultValue="pergunta_recorrente">
              <option value="pergunta_recorrente">Pergunta recorrente</option>
              <option value="analogia">Analogia</option>
            </select>
          </label>
          <label>
            Conteúdo
            <textarea name="conteudoTextual" required />
          </label>
          <label>
            Origem (opcional)
            <input type="text" name="origem" />
          </label>
          <SubmitButton>Registrar</SubmitButton>
        </form>
      </section>
    </div>
  );
}
