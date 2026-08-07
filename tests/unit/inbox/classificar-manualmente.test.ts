import { describe, it, expect } from "vitest";
import {
  classificarManualmente,
  RegistroBrutoNaoEncontradoError,
  DecisaoInvalidaError,
} from "@/inbox/application/classificar-manualmente";
import { FakeRegistroBrutoRepository } from "./_fakes/fake-registro-bruto-repository";
import { SystemUuidGenerator } from "@/shared/infrastructure/system-uuid-generator";
import type { EventoDeDominio, IEventPublisher } from "@/shared/domain/i-event-publisher";

/**
 * Sprint 23 — DOGFOODING_REPORT.md, item 1: caminho manual para
 * destravar um RegistroBruto que ficaria preso em `capturado` sem IA.
 *
 * Sprint 23A: rastreabilidade — publica `registro_bruto.classificado`
 * (igual ao fluxo por IA) e também `registro_bruto.classificado_manualmente`
 * (equivalente ao `sugestao.aceita` do fluxo por IA, sem fingir que
 * uma SugestaoIA existiu).
 */
class FakeEventPublisher implements IEventPublisher {
  eventos: EventoDeDominio[] = [];
  async publicar(evento: EventoDeDominio) {
    this.eventos.push(evento);
  }
}

describe("classificarManualmente", () => {
  function montarDeps() {
    return {
      registroBrutoRepository: new FakeRegistroBrutoRepository(),
      uuidGenerator: new SystemUuidGenerator(),
      eventPublisher: new FakeEventPublisher(),
    };
  }

  it("classifica um registro 'capturado' sem nenhuma SugestaoIA envolvida", async () => {
    const deps = montarDeps();
    const registro = await deps.registroBrutoRepository.criar({
      tipoEntrada: "texto",
      conteudoTexto: "Ideia solta",
      conteudoBinarioRef: null,
      mimeType: null,
      tamanhoBytes: null,
      dataCaptura: new Date(),
      origem: "ideia",
      reuniaoId: null,
      status: "capturado",
      metadata: null,
    });

    const resultado = await classificarManualmente(
      { registroBrutoId: registro.id, tipoDestinoEscolhido: "tarefa" },
      deps
    );

    expect(resultado.tipoDestinoFinal).toBe("tarefa");
    expect((await deps.registroBrutoRepository.buscarPorId(registro.id))?.status).toBe("classificado");
    const destinos = await deps.registroBrutoRepository.listarDestinos(registro.id);
    expect(destinos).toHaveLength(1);
    expect(destinos[0]?.tipoDestino).toBe("tarefa");

    const nomesDosEventos = deps.eventPublisher.eventos.map((e) => e.eventName);
    expect(nomesDosEventos).toContain("registro_bruto.classificado");
    expect(nomesDosEventos).toContain("registro_bruto.classificado_manualmente");
    expect(nomesDosEventos).not.toContain("sugestao.aceita");
  });

  it("rejeita registro inexistente", async () => {
    const deps = montarDeps();
    await expect(
      classificarManualmente(
        { registroBrutoId: "00000000-0000-0000-0000-000000000000", tipoDestinoEscolhido: "tarefa" },
        deps
      )
    ).rejects.toThrow(RegistroBrutoNaoEncontradoError);
  });

  it("rejeita registro já classificado ou descartado", async () => {
    const deps = montarDeps();
    const registro = await deps.registroBrutoRepository.criar({
      tipoEntrada: "texto",
      conteudoTexto: "Já tratado",
      conteudoBinarioRef: null,
      mimeType: null,
      tamanhoBytes: null,
      dataCaptura: new Date(),
      origem: "ideia",
      reuniaoId: null,
      status: "descartado",
      metadata: null,
    });

    await expect(
      classificarManualmente({ registroBrutoId: registro.id, tipoDestinoEscolhido: "tarefa" }, deps)
    ).rejects.toThrow(DecisaoInvalidaError);
  });
});
