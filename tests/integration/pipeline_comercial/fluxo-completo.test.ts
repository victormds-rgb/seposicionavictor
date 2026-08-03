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

describe("Fluxo completo do Pipeline Comercial (integração)", () => {
  const leadRepository = new DrizzleLeadRepository();
  const clienteRepository = new DrizzleClienteRepository();
  const reuniaoRepository = new DrizzleReuniaoRepository();
  const itemDeAgendaRepository = new DrizzleItemDeAgendaRepository();

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
      { leadRepository }
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

    await marcarLeadComoReunido(lead.id, { leadRepository });
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
    await qualificarLead({ leadId: lead.id }, { leadRepository });
    const { reuniao } = await agendarComercial(
      { leadId: lead.id, dataHora: new Date(Date.now() + 60 * 60 * 1000) },
      { leadRepository, reuniaoRepository, itemDeAgendaRepository }
    );
    await marcarReuniaoComoRealizada(reuniao.id, undefined, { reuniaoRepository });
    await marcarLeadComoReunido(lead.id, { leadRepository });

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
});
