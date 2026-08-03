import { describe, it, expect } from "vitest";
import { DrizzleReuniaoRepository } from "@/reunioes/infrastructure/reuniao-repository";
import { DrizzleItemDeAgendaRepository } from "@/agenda/infrastructure/item-agenda-repository";
import { DrizzleRegistroBrutoRepository } from "@/inbox/infrastructure/registro-bruto-repository";
import { DrizzleSugestaoIARepository } from "@/ia/infrastructure/sugestao-ia-repository";
import { agendarReuniao } from "@/reunioes/application/agendar-reuniao";
import { marcarReuniaoComoRealizada } from "@/reunioes/application/marcar-reuniao-como-realizada";
import {
  marcarReuniaoComoProcessada,
  TransicaoInvalidaError,
} from "@/reunioes/application/marcar-reuniao-como-processada";
import { instanciarRotinaSemanal } from "@/agenda/application/instanciar-rotina-semanal";
import { atualizarItensVencidos } from "@/agenda/application/atualizar-itens-vencidos";
import { capturarRegistroBruto } from "@/inbox/application/capturar-registro-bruto";
import { responderSugestao } from "@/inbox/application/responder-sugestao";
import { FakePortaDeIA } from "../../unit/ia/_fakes/fake-porta-de-ia";
import { FakePortaDeArmazenamentoBinario } from "../../unit/inbox/_fakes/fake-porta-de-armazenamento";
import { SystemUuidGenerator } from "@/shared/infrastructure/system-uuid-generator";
import type { IEventPublisher } from "@/shared/domain/i-event-publisher";

describe("Fluxo completo de Agenda e Reuniões (integração)", () => {
  const reuniaoRepository = new DrizzleReuniaoRepository();
  const itemDeAgendaRepository = new DrizzleItemDeAgendaRepository();
  const registroBrutoRepository = new DrizzleRegistroBrutoRepository();
  const sugestaoIARepository = new DrizzleSugestaoIARepository();
  const portaDeIA = new FakePortaDeIA();
  const portaDeArmazenamento = new FakePortaDeArmazenamentoBinario();
  const uuidGenerator = new SystemUuidGenerator();

  it("agendar reunião cria também o ItemDeAgenda correspondente", async () => {
    const dataHora = new Date(Date.now() + 60 * 60 * 1000);
    const reuniao = await agendarReuniao(
      { dataHora, local: "Escritório" },
      { reuniaoRepository, itemDeAgendaRepository }
    );

    expect(reuniao.status).toBe("agendada");

    const itens = await itemDeAgendaRepository.listar({
      de: new Date(dataHora.getTime() - 1000),
      ate: new Date(dataHora.getTime() + 1000),
    });
    const itemDaReuniao = itens.find((i) => i.reuniaoId === reuniao.id);
    expect(itemDaReuniao).toBeDefined();
    expect(itemDaReuniao?.tipo).toBe("reuniao");
    expect(itemDaReuniao?.status).toBe("agendado");
  });

  it("não permite marcar como processada sem RegistroBruto classificado associado", async () => {
    const reuniao = await agendarReuniao(
      { dataHora: new Date(Date.now() + 2 * 60 * 60 * 1000) },
      { reuniaoRepository, itemDeAgendaRepository }
    );

    await marcarReuniaoComoRealizada(reuniao.id, "Notas rápidas da reunião.", {
      reuniaoRepository,
    });

    await expect(
      marcarReuniaoComoProcessada(reuniao.id, { reuniaoRepository, registroBrutoRepository })
    ).rejects.toThrow(TransicaoInvalidaError);
  });

  it("fluxo completo: agendar → realizar → capturar na Inbox → aceitar sugestão → processar", async () => {
    const reuniao = await agendarReuniao(
      { dataHora: new Date(Date.now() + 3 * 60 * 60 * 1000) },
      { reuniaoRepository, itemDeAgendaRepository }
    );

    await marcarReuniaoComoRealizada(reuniao.id, undefined, { reuniaoRepository });

    const registro = await capturarRegistroBruto(
      {
        tipoEntrada: "texto",
        origem: "reuniao",
        conteudoTexto: "Cliente pediu para revisar a proposta comercial.",
        reuniaoId: reuniao.id,
      },
      { registroBrutoRepository, portaDeArmazenamento, portaDeIA, sugestaoIARepository }
    );

    expect(registro.reuniaoId).toBe(reuniao.id);

    const sugestao = await sugestaoIARepository.buscarPendentePorRegistroOrigem(registro.id);
    await responderSugestao(
      { sugestaoId: sugestao!.id, decisao: "aceitar" },
      { registroBrutoRepository, sugestaoIARepository, uuidGenerator }
    );

    await marcarReuniaoComoProcessada(reuniao.id, { reuniaoRepository, registroBrutoRepository });

    const reuniaoFinal = await reuniaoRepository.buscarPorId(reuniao.id);
    expect(reuniaoFinal?.status).toBe("processada");
  });

  it("instancia a rotina semanal fixa (5 itens) e é idempotente ao rodar de novo", async () => {
    const segunda = new Date();
    segunda.setDate(segunda.getDate() - segunda.getDay() + 1);
    segunda.setHours(0, 0, 0, 0);
    // Usa uma semana aleatória e distante para garantir isolamento
    // mesmo em reexecuções repetidas contra o mesmo banco (uma data
    // fixa causaria falso-negativo na segunda vez que a suíte
    // rodasse sem recriar o banco — encontrado durante a Sprint 5).
    segunda.setFullYear(segunda.getFullYear() + 2 + Math.floor(Math.random() * 1000));

    const primeiraExecucao = await instanciarRotinaSemanal(segunda, { itemDeAgendaRepository });
    expect(primeiraExecucao).toHaveLength(5);

    const segundaExecucao = await instanciarRotinaSemanal(segunda, { itemDeAgendaRepository });
    expect(segundaExecucao).toHaveLength(0);
  });

  it("marca itens vencidos como 'perdido' (notificação básica de ausência)", async () => {
    const dataPassada = new Date(Date.now() - 60 * 60 * 1000);
    const reuniaoPassada = await reuniaoRepository.criar({
      dataHora: dataPassada,
      participantes: null,
      clienteId: null,
      projetoId: null,
      local: null,
      notasBrutas: null,
      status: "agendada",
      metadata: null,
    });

    const item = await itemDeAgendaRepository.criar({
      tipo: "reuniao",
      dataHora: dataPassada,
      reuniaoId: reuniaoPassada.id,
      tarefaId: null,
      rotinaFixaReferencia: null,
      recorrente: false,
      status: "agendado",
    });

    const atualizados = await atualizarItensVencidos(new Date(), { itemDeAgendaRepository });
    expect(atualizados).toContain(item.id);

    const itemFinal = await itemDeAgendaRepository.buscarPorId(item.id);
    expect(itemFinal?.status).toBe("perdido");
  });

  // Sprint 14 — Hardening Final, item 3: concorrência real contra o
  // banco. Duas chamadas simultâneas para `marcarComoPerdidoSeAgendado`
  // no MESMO item — só uma pode afetar a linha (UPDATE otimista com
  // WHERE status='agendado', corrigido no Hardening/Sprint 10).
  it("marcarComoPerdidoSeAgendado é seguro sob concorrência — só um UPDATE, um evento, estado final correto", async () => {
    const dataPassada = new Date(Date.now() - 60 * 60 * 1000);
    const item = await itemDeAgendaRepository.criar({
      tipo: "tarefa_com_prazo",
      dataHora: dataPassada,
      reuniaoId: null,
      tarefaId: null,
      rotinaFixaReferencia: null,
      recorrente: false,
      status: "agendado",
    });

    const [linhasAfetadas1, linhasAfetadas2] = await Promise.all([
      itemDeAgendaRepository.marcarComoPerdidoSeAgendado(item.id),
      itemDeAgendaRepository.marcarComoPerdidoSeAgendado(item.id),
    ]);

    // Apenas um UPDATE afetou a linha — a soma das duas chamadas
    // concorrentes é exatamente 1 (0 + 1, nunca 1 + 1).
    expect(linhasAfetadas1 + linhasAfetadas2).toBe(1);

    const itemFinal = await itemDeAgendaRepository.buscarPorId(item.id);
    expect(itemFinal?.status).toBe("perdido");

    // O mesmo padrão, agora na Application, garante um único evento:
    // `atualizarItensVencidos` só publica `item_agenda.perdido` quando
    // `marcarComoPerdidoSeAgendado` retorna 1 (ver
    // src/agenda/application/atualizar-itens-vencidos.ts).
    const outroItem = await itemDeAgendaRepository.criar({
      tipo: "tarefa_com_prazo",
      dataHora: dataPassada,
      reuniaoId: null,
      tarefaId: null,
      rotinaFixaReferencia: null,
      recorrente: false,
      status: "agendado",
    });

    const eventosPublicados: string[] = [];
    const eventPublisherContador: IEventPublisher = {
      async publicar(evento) {
        eventosPublicados.push(evento.aggregateId);
      },
    };

    const agora = new Date();
    await Promise.all([
      atualizarItensVencidos(agora, { itemDeAgendaRepository, eventPublisher: eventPublisherContador }),
      atualizarItensVencidos(agora, { itemDeAgendaRepository, eventPublisher: eventPublisherContador }),
    ]);

    const publicacoesDoOutroItem = eventosPublicados.filter((id) => id === outroItem.id);
    expect(publicacoesDoOutroItem).toHaveLength(1);
  });
});
