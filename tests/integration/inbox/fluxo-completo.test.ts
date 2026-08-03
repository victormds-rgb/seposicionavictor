import { describe, it, expect, beforeAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@infra/persistence/db/client";
import { DrizzleRegistroBrutoRepository } from "@/inbox/infrastructure/registro-bruto-repository";
import { DrizzleSugestaoIARepository } from "@/ia/infrastructure/sugestao-ia-repository";
import { capturarRegistroBruto } from "@/inbox/application/capturar-registro-bruto";
import { responderSugestao } from "@/inbox/application/responder-sugestao";
import { FakePortaDeIA } from "../../unit/ia/_fakes/fake-porta-de-ia";
import { FakePortaDeArmazenamentoBinario } from "../../unit/inbox/_fakes/fake-porta-de-armazenamento";
import { SystemUuidGenerator } from "@/shared/infrastructure/system-uuid-generator";

/**
 * Teste de integração — Sprint 2.
 *
 * Exercita o fluxo real de ponta a ponta descrito em ARCHITECTURE.md,
 * seção 6 (Captura → Persistência → Classificação → Confirmação
 * humana → Persistência final → event_log), usando repositórios
 * Drizzle reais contra um Postgres real. Apenas a Porta de IA e a
 * Porta de Armazenamento são fakes (evita dependência de rede
 * externa — OpenRouter/Supabase Storage não estão acessíveis neste
 * ambiente de teste).
 *
 * Requer DATABASE_URL apontando para um Postgres com as migrations
 * já aplicadas (ver README.md).
 */
describe("Fluxo completo da Inbox Universal (integração)", () => {
  const registroBrutoRepository = new DrizzleRegistroBrutoRepository();
  const sugestaoIARepository = new DrizzleSugestaoIARepository();
  const portaDeIA = new FakePortaDeIA();
  const portaDeArmazenamento = new FakePortaDeArmazenamentoBinario();
  const uuidGenerator = new SystemUuidGenerator();

  beforeAll(async () => {
    // Sanidade: garante que a tabela existe antes de rodar os testes.
    await db.execute(sql`select 1 from registro_bruto limit 1`);
  });

  it("captura texto, classifica automaticamente e persiste a SugestaoIA como pendente", async () => {
    const registro = await capturarRegistroBruto(
      {
        tipoEntrada: "texto",
        origem: "ideia",
        conteudoTexto: "Lembrar de revisar o contrato do cliente X.",
      },
      { registroBrutoRepository, portaDeArmazenamento, portaDeIA, sugestaoIARepository }
    );

    expect(registro.status).toBe("classificacao_sugerida");

    const sugestao = await sugestaoIARepository.buscarPendentePorRegistroOrigem(registro.id);
    expect(sugestao).not.toBeNull();
    expect(sugestao?.provider).toBe("fake");
    expect(sugestao?.status).toBe("pendente");

    const conteudo = sugestao?.conteudoSugerido as { tipoDestinoSugerido?: string };
    expect(conteudo.tipoDestinoSugerido).toBe("tarefa");
  });

  it("ao aceitar a sugestão, cria RegistroBrutoDestino e marca o registro como classificado", async () => {
    const registro = await capturarRegistroBruto(
      {
        tipoEntrada: "observacao",
        origem: "aprendizado",
        conteudoTexto: "Ideia: automatizar o follow-up de leads frios.",
      },
      { registroBrutoRepository, portaDeArmazenamento, portaDeIA, sugestaoIARepository }
    );

    const sugestao = await sugestaoIARepository.buscarPendentePorRegistroOrigem(registro.id);
    expect(sugestao).not.toBeNull();

    const resultado = await responderSugestao(
      { sugestaoId: sugestao!.id, decisao: "aceitar" },
      { registroBrutoRepository, sugestaoIARepository, uuidGenerator }
    );

    expect(resultado.status).toBe("aceita");

    const registroAtualizado = await registroBrutoRepository.buscarPorId(registro.id);
    expect(registroAtualizado?.status).toBe("classificado");

    const destinos = await registroBrutoRepository.listarDestinos(registro.id);
    expect(destinos).toHaveLength(1);
    expect(destinos[0]?.tipoDestino).toBe("tarefa");

    const sugestaoAtualizada = await sugestaoIARepository.buscarPorId(sugestao!.id);
    expect(sugestaoAtualizada?.status).toBe("aceita");
  });

  it("ao editar a sugestão, registra o tipo de destino escolhido por Victor (diferente do sugerido)", async () => {
    const registro = await capturarRegistroBruto(
      {
        tipoEntrada: "texto",
        origem: "ideia",
        conteudoTexto: "Isso na verdade deveria virar conteúdo, não tarefa.",
      },
      { registroBrutoRepository, portaDeArmazenamento, portaDeIA, sugestaoIARepository }
    );

    const sugestao = await sugestaoIARepository.buscarPendentePorRegistroOrigem(registro.id);

    const resultado = await responderSugestao(
      {
        sugestaoId: sugestao!.id,
        decisao: "editar",
        tipoDestinoEscolhido: "peca_conteudo",
      },
      { registroBrutoRepository, sugestaoIARepository, uuidGenerator }
    );

    expect(resultado.status).toBe("editada_e_aceita");
    expect(resultado.tipoDestinoFinal).toBe("peca_conteudo");

    const destinos = await registroBrutoRepository.listarDestinos(registro.id);
    expect(destinos[0]?.tipoDestino).toBe("peca_conteudo");
  });

  it("ao rejeitar, mantém o RegistroBruto sem destino e a sugestão como rejeitada", async () => {
    const registro = await capturarRegistroBruto(
      {
        tipoEntrada: "texto",
        origem: "ideia",
        conteudoTexto: "Sugestão que Victor vai rejeitar neste teste.",
      },
      { registroBrutoRepository, portaDeArmazenamento, portaDeIA, sugestaoIARepository }
    );

    const sugestao = await sugestaoIARepository.buscarPendentePorRegistroOrigem(registro.id);

    const resultado = await responderSugestao(
      { sugestaoId: sugestao!.id, decisao: "rejeitar", motivoRejeicao: "Não é bem uma tarefa." },
      { registroBrutoRepository, sugestaoIARepository, uuidGenerator }
    );

    expect(resultado.status).toBe("rejeitada");

    const registroAtualizado = await registroBrutoRepository.buscarPorId(registro.id);
    expect(registroAtualizado?.status).toBe("classificacao_sugerida");

    const destinos = await registroBrutoRepository.listarDestinos(registro.id);
    expect(destinos).toHaveLength(0);
  });

  it("busca e filtros retornam apenas os registros que correspondem aos critérios", async () => {
    const marcador = `marcador-${Date.now()}`;
    await capturarRegistroBruto(
      { tipoEntrada: "texto", origem: "ideia", conteudoTexto: `${marcador} — texto único` },
      { registroBrutoRepository, portaDeArmazenamento, portaDeIA, sugestaoIARepository }
    );

    const resultados = await registroBrutoRepository.listar({ textoBusca: marcador });
    expect(resultados).toHaveLength(1);
    expect(resultados[0]?.conteudoTexto).toContain(marcador);
  });
});
