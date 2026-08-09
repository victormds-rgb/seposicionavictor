import { describe, it, expect } from "vitest";
import { DrizzleLeadRepository } from "@/pipeline_comercial/infrastructure/lead-repository";
import { DrizzleClienteRepository } from "@/clientes/infrastructure/cliente-repository";
import { DrizzleReuniaoRepository } from "@/reunioes/infrastructure/reuniao-repository";
import { DrizzleItemDeAgendaRepository } from "@/agenda/infrastructure/item-agenda-repository";
import { criarLead } from "@/pipeline_comercial/application/criar-lead";
import { qualificarLead } from "@/pipeline_comercial/application/qualificar-lead";
import { agendarComercial } from "@/pipeline_comercial/application/agendar-comercial";
import { marcarLeadComoReunido } from "@/pipeline_comercial/application/marcar-lead-como-reunido";
import {
  converterLeadEmCliente,
  TransicaoInvalidaError,
} from "@/clientes/application/converter-lead-em-cliente";
import { marcarReuniaoComoRealizada } from "@/reunioes/application/marcar-reuniao-como-realizada";
import {
  marcarLeadComoPerdido,
  TransicaoInvalidaError as PerdaTransicaoInvalidaError,
} from "@/pipeline_comercial/application/marcar-lead-como-perdido";
import {
  registrarContatoComLead,
  TransicaoInvalidaError as ContatoTransicaoInvalidaError,
} from "@/pipeline_comercial/application/registrar-contato-com-lead";
import { definirProximoContato } from "@/pipeline_comercial/application/definir-proximo-contato";
import { SystemClock } from "@/shared/infrastructure/system-clock";

describe("Fluxo completo do Pipeline Comercial (integração)", () => {
  const leadRepository = new DrizzleLeadRepository();
  const clienteRepository = new DrizzleClienteRepository();
  const reuniaoRepository = new DrizzleReuniaoRepository();
  const itemDeAgendaRepository = new DrizzleItemDeAgendaRepository();
  const clock = new SystemClock();

  it("não permite converter um Lead antes de passar por reunião (invariante ADR-006)", async () => {
    const lead = await criarLead({ nome: "Lead sem processo completo" }, { leadRepository });

    await expect(
      converterLeadEmCliente(
        {
          leadId: lead.id,
          temAutoridadeReal: true,
          aceitaDiagnostico: true,
          sinalNaoCumprimento: false,
        },
        { leadRepository, clienteRepository }
      )
    ).rejects.toThrow(TransicaoInvalidaError);
  });

  it("fluxo completo: criar → qualificar → agendar (cria Reuniao) → reunido → converter", async () => {
    const lead = await criarLead(
      { nome: "Clínica Aurora", origemLead: "indicação", temperatura: "quente" },
      { leadRepository }
    );
    expect(lead.statusComercial).toBe("novo");

    await qualificarLead(
      {
        leadId: lead.id,
        resumoQualificacao: "Clínica busca posicionamento digital.",
        proximoPasso: "Agendar apresentação.",
      },
      { leadRepository, clock }
    );

    const leadQualificado = await leadRepository.buscarPorId(lead.id);
    expect(leadQualificado?.statusComercial).toBe("qualificado");

    const { reuniao, agendamento } = await agendarComercial(
      { leadId: lead.id, dataHora: new Date(Date.now() + 60 * 60 * 1000) },
      { leadRepository, reuniaoRepository, itemDeAgendaRepository }
    );

    expect(agendamento.reuniaoId).toBe(reuniao.id);
    const leadAgendado = await leadRepository.buscarPorId(lead.id);
    expect(leadAgendado?.statusComercial).toBe("agendado");

    // A reunião em si é gerenciada pelo contexto Reuniões (Sprint 3),
    // reaproveitado aqui sem duplicação de lógica.
    await marcarReuniaoComoRealizada(reuniao.id, "Foi bem, cliente muito interessado.", {
      reuniaoRepository,
    });

    await marcarLeadComoReunido(lead.id, { leadRepository, clock });
    const leadReunido = await leadRepository.buscarPorId(lead.id);
    expect(leadReunido?.statusComercial).toBe("reunido");

    const cliente = await converterLeadEmCliente(
      {
        leadId: lead.id,
        nome: "Clínica Aurora Ltda",
        setor: "saúde",
        temAutoridadeReal: true,
        aceitaDiagnostico: true,
        sinalNaoCumprimento: false,
      },
      { leadRepository, clienteRepository }
    );

    expect(cliente.status).toBe("ativo");
    expect(cliente.classificacaoResultante).toBe("prioridade_alta");
    // Invariante ADR-006: Lead e Cliente são registros distintos,
    // ligados apenas por referência de origem.
    expect(cliente.origemLeadId).toBe(lead.id);
    expect(cliente.id).not.toBe(lead.id);

    const leadFinal = await leadRepository.buscarPorId(lead.id);
    expect(leadFinal?.statusComercial).toBe("convertido_cliente");
    // O registro do Lead nunca é apagado ou "virado" em Cliente.
    expect(leadFinal).not.toBeNull();
  });

  it("aplica corretamente a classificação 'exigir_contrato_reforcado' quando há sinal de não cumprimento", async () => {
    const lead = await criarLead({ nome: "Lead com histórico ruim" }, { leadRepository });
    await qualificarLead({ leadId: lead.id }, { leadRepository, clock });
    const { reuniao } = await agendarComercial(
      { leadId: lead.id, dataHora: new Date(Date.now() + 60 * 60 * 1000) },
      { leadRepository, reuniaoRepository, itemDeAgendaRepository }
    );
    await marcarReuniaoComoRealizada(reuniao.id, undefined, { reuniaoRepository });
    await marcarLeadComoReunido(lead.id, { leadRepository, clock });

    const cliente = await converterLeadEmCliente(
      {
        leadId: lead.id,
        temAutoridadeReal: true,
        aceitaDiagnostico: true,
        sinalNaoCumprimento: true,
      },
      { leadRepository, clienteRepository }
    );

    expect(cliente.classificacaoResultante).toBe("exigir_contrato_reforcado");
  });

  // Sprint 42 (Fundação Comercial)
  describe("Fundação Comercial (Sprint 42)", () => {
    it("criar Lead persiste canalOrigem/campanha/interesse, preservando origemLead como detalhe livre", async () => {
      const lead = await criarLead(
        {
          nome: "Lead com canal estruturado",
          origemLead: "veio pelo story de sexta",
          canalOrigem: "instagram",
          campanha: "lancamento-agosto",
          interesse: "consultoria de posicionamento",
        },
        { leadRepository }
      );

      expect(lead.canalOrigem).toBe("instagram");
      expect(lead.campanha).toBe("lancamento-agosto");
      expect(lead.interesse).toBe("consultoria de posicionamento");
      expect(lead.origemLead).toBe("veio pelo story de sexta");
      expect(lead.ultimoContatoEm).toBeNull();
      expect(lead.criadoEm).toBeInstanceOf(Date);
    });

    it("qualificar e marcar como reunido registram contato real — nunca via updatedAt", async () => {
      const lead = await criarLead({ nome: "Lead para checar contato" }, { leadRepository });
      expect(lead.ultimoContatoEm).toBeNull();

      await qualificarLead({ leadId: lead.id }, { leadRepository, clock });
      const apósQualificar = await leadRepository.buscarPorId(lead.id);
      expect(apósQualificar?.ultimoContatoEm).not.toBeNull();

      const { reuniao } = await agendarComercial(
        { leadId: lead.id, dataHora: new Date(Date.now() + 60 * 60 * 1000) },
        { leadRepository, reuniaoRepository, itemDeAgendaRepository }
      );
      await marcarReuniaoComoRealizada(reuniao.id, undefined, { reuniaoRepository });

      const contatoAntesDaReuniao = apósQualificar!.ultimoContatoEm!;
      await new Promise((r) => setTimeout(r, 10));
      await marcarLeadComoReunido(lead.id, { leadRepository, clock });

      const apósReuniao = await leadRepository.buscarPorId(lead.id);
      expect(apósReuniao?.ultimoContatoEm!.getTime()).toBeGreaterThan(contatoAntesDaReuniao.getTime());
    });

    it("registrarContatoComLead atualiza ultimoContatoEm de forma independente e falha para lead resolvido", async () => {
      const lead = await criarLead({ nome: "Lead para contato manual" }, { leadRepository });

      await registrarContatoComLead({ leadId: lead.id }, { leadRepository, clock });
      const contatado = await leadRepository.buscarPorId(lead.id);
      expect(contatado?.ultimoContatoEm).not.toBeNull();

      await marcarLeadComoPerdido(
        { leadId: lead.id, motivoPerda: "orçamento insuficiente" },
        { leadRepository }
      );

      await expect(
        registrarContatoComLead({ leadId: lead.id }, { leadRepository, clock })
      ).rejects.toThrow(ContatoTransicaoInvalidaError);
    });

    it("definirProximoContato grava a data escolhida pelo usuário", async () => {
      const lead = await criarLead({ nome: "Lead com follow-up" }, { leadRepository });
      const dataEscolhida = new Date("2026-09-01T13:00:00Z");

      await definirProximoContato({ leadId: lead.id, proximoContatoEm: dataEscolhida }, { leadRepository });

      const atualizado = await leadRepository.buscarPorId(lead.id);
      expect(atualizado?.proximoContatoEm?.toISOString()).toBe(dataEscolhida.toISOString());
    });

    it("marcarLeadComoPerdido funciona a partir de qualquer estágio ativo (ex.: direto de 'novo'), preserva histórico e registra o motivo", async () => {
      const lead = await criarLead({ nome: "Lead que esfriou rápido" }, { leadRepository });
      expect(lead.statusComercial).toBe("novo");

      await marcarLeadComoPerdido(
        { leadId: lead.id, motivoPerda: "não respondeu após 3 tentativas" },
        { leadRepository }
      );

      const perdido = await leadRepository.buscarPorId(lead.id);
      expect(perdido?.statusComercial).toBe("perdido");
      expect(perdido?.motivoPerda).toBe("não respondeu após 3 tentativas");
      // Nunca apaga o registro — histórico preservado.
      expect(perdido).not.toBeNull();
      expect(perdido?.nome).toBe("Lead que esfriou rápido");
    });

    it("marcarLeadComoPerdido rejeita um lead já perdido e um lead já convertido em cliente", async () => {
      const leadJaPerdido = await criarLead({ nome: "Lead já perdido" }, { leadRepository });
      await marcarLeadComoPerdido(
        { leadId: leadJaPerdido.id, motivoPerda: "primeiro motivo" },
        { leadRepository }
      );
      await expect(
        marcarLeadComoPerdido(
          { leadId: leadJaPerdido.id, motivoPerda: "segundo motivo" },
          { leadRepository }
        )
      ).rejects.toThrow(PerdaTransicaoInvalidaError);

      const leadConvertido = await criarLead({ nome: "Lead que vai converter" }, { leadRepository });
      await qualificarLead({ leadId: leadConvertido.id }, { leadRepository, clock });
      const { reuniao } = await agendarComercial(
        { leadId: leadConvertido.id, dataHora: new Date(Date.now() + 60 * 60 * 1000) },
        { leadRepository, reuniaoRepository, itemDeAgendaRepository }
      );
      await marcarReuniaoComoRealizada(reuniao.id, undefined, { reuniaoRepository });
      await marcarLeadComoReunido(leadConvertido.id, { leadRepository, clock });
      await converterLeadEmCliente(
        {
          leadId: leadConvertido.id,
          temAutoridadeReal: true,
          aceitaDiagnostico: true,
          sinalNaoCumprimento: false,
        },
        { leadRepository, clienteRepository }
      );

      await expect(
        marcarLeadComoPerdido(
          { leadId: leadConvertido.id, motivoPerda: "tarde demais" },
          { leadRepository }
        )
      ).rejects.toThrow(PerdaTransicaoInvalidaError);
    });

    it("motivoPerda é obrigatório — string vazia é rejeitada antes de tocar o repositório", async () => {
      const lead = await criarLead({ nome: "Lead sem motivo" }, { leadRepository });
      await expect(
        marcarLeadComoPerdido({ leadId: lead.id, motivoPerda: "" }, { leadRepository })
      ).rejects.toThrow();

      const inalterado = await leadRepository.buscarPorId(lead.id);
      expect(inalterado?.statusComercial).toBe("novo");
    });
  });
});
