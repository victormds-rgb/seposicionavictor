import { describe, it, expect, beforeAll } from "vitest";
import { DrizzleProjetoRepository } from "@/projetos/infrastructure/projeto-repository";
import { DrizzleCaseRepository } from "@/cases/infrastructure/case-repository";
import { DrizzleBuildLogRepository } from "@/build_logs/infrastructure/build-log-repository";
import { DrizzleClienteRepository } from "@/clientes/infrastructure/cliente-repository";
import { criarProjeto, CriacaoInvalidaError } from "@/projetos/application/criar-projeto";
import { atualizarCamposDeCaseDoProjeto } from "@/projetos/application/atualizar-campos-de-case-do-projeto";
import {
  criarCriterioDeLancamento,
  satisfazerCriterioDeLancamento,
} from "@/projetos/application/criterio-de-lancamento";
import {
  criarCaseAPartirDeProjeto,
  ProjetoNaoProntoParaCaseError,
} from "@/cases/application/criar-case-a-partir-de-projeto";
import { atualizarCamposDoCase } from "@/cases/application/atualizar-campos-do-case";
import { publicarCase, listarHistoricoDoCase, CaseNaoPodeSerPublicadoError } from "@/cases/application/publicar-case";
import {
  criarBuildLog,
  atualizarCamposDoBuildLog,
  publicarBuildLog,
  BuildLogNaoPodePublicarError,
} from "@/build_logs/application/build-log-use-cases";

describe("Fluxo completo de Projetos, Cases e Build Logs (integração)", () => {
  const projetoRepository = new DrizzleProjetoRepository();
  const caseRepository = new DrizzleCaseRepository();
  const buildLogRepository = new DrizzleBuildLogRepository();
  const clienteRepository = new DrizzleClienteRepository();

  let clienteId: string;

  beforeAll(async () => {
    // Um Projeto cliente_externo real exige um Cliente já existente
    // (FK formalizada nesta Sprint) — criado aqui como fixture de teste.
    const cliente = await clienteRepository.criar({
      nome: "Clínica de Teste",
      setor: "saúde",
      temAutoridadeReal: true,
      aceitaDiagnostico: true,
      sinalNaoCumprimento: false,
      classificacaoResultante: "prioridade_alta",
      urgenciaFinanceira: null,
      status: "ativo",
      origemLeadId: null,
      metadata: null,
    });
    clienteId = cliente.id;
  });

  it("não permite criar Projeto de cliente_externo sem desculpa e custo mensal", async () => {
    await expect(
      criarProjeto(
        { nome: "Projeto inválido", tipo: "cliente_externo", clienteId },
        { projetoRepository }
      )
    ).rejects.toThrow(CriacaoInvalidaError);
  });

  it("não permite criar Case antes do Projeto estar pronto_para_case", async () => {
    const projeto = await criarProjeto(
      {
        nome: "Projeto ainda incompleto",
        tipo: "cliente_externo",
        clienteId,
        desculpaInicial: "achava que investir pouco era seguro",
        custoMensal: 300,
      },
      { projetoRepository }
    );

    await expect(
      criarCaseAPartirDeProjeto(projeto.id, { projetoRepository, caseRepository })
    ).rejects.toThrow(ProjetoNaoProntoParaCaseError);
  });

  it("fluxo completo: criar Projeto → preencher campos → pronto_para_case → criar Case → editar (gera histórico) → publicar", async () => {
    const projeto = await criarProjeto(
      {
        nome: "Salão de Beleza — Caso Real",
        tipo: "cliente_externo",
        clienteId,
        desculpaInicial: "achava que investir pouco era seguro",
        custoMensal: 200,
      },
      { projetoRepository }
    );
    expect(projeto.status).toBe("iniciado");

    const atualizado1 = await atualizarCamposDeCaseDoProjeto(
      { projetoId: projeto.id, momentoQuebra: "perdeu dinheiro real com o atalho" },
      { projetoRepository }
    );
    expect(atualizado1?.status).toBe("iniciado"); // ainda incompleto

    const atualizadoFinal = await atualizarCamposDeCaseDoProjeto(
      {
        projetoId: projeto.id,
        solucao: "correção de crença + investimento certo",
        tempoDecorrido: "1 semana",
        numeroResultado: "20+ mensagens, R$200 investidos",
      },
      { projetoRepository }
    );
    expect(atualizadoFinal?.status).toBe("pronto_para_case");

    const caso = await criarCaseAPartirDeProjeto(projeto.id, { projetoRepository, caseRepository });
    expect(caso.status).toBe("completo"); // snapshot já veio com os 6 campos

    const historicoAposCriacao = await listarHistoricoDoCase(caso.id, { caseRepository });
    expect(historicoAposCriacao).toHaveLength(1);

    // Edição: SEMPRE gera entrada em case_historico (auditabilidade).
    await atualizarCamposDoCase(
      { caseId: caso.id, numeroResultado: "22 mensagens, R$200 investidos (número revisado)" },
      { caseRepository }
    );
    const historicoAposEdicao = await listarHistoricoDoCase(caso.id, { caseRepository });
    expect(historicoAposEdicao).toHaveLength(2);

    const casoAtualizado = await caseRepository.buscarPorId(caso.id);
    expect(casoAtualizado?.status).toBe("completo"); // continua completo após edição válida

    await publicarCase(caso.id, { caseRepository });
    const casoPublicado = await caseRepository.buscarPorId(caso.id);
    expect(casoPublicado?.status).toBe("publicado");

    // Invariante: não pode publicar de novo.
    await expect(publicarCase(caso.id, { caseRepository })).rejects.toThrow(
      CaseNaoPodeSerPublicadoError
    );
  });

  it("Build Log: não publica sem os 4 campos, publica quando completo (SOM Cap. 4.4)", async () => {
    const projeto = await criarProjeto(
      { nome: "Radar AI", tipo: "produto_proprio" },
      { projetoRepository }
    );

    const log = await criarBuildLog(
      { projetoId: projeto.id, contexto: "testando com usuário externo" },
      { buildLogRepository }
    );
    expect(log.status).toBe("rascunho");

    await expect(publicarBuildLog(log.id, { buildLogRepository })).rejects.toThrow(
      BuildLogNaoPodePublicarError
    );

    await atualizarCamposDoBuildLog(
      {
        buildLogId: log.id,
        quebra: "onboarding travou no meio",
        decisao: "simplificar para 2 passos",
        proximoPasso: "testar com mais 2 usuários",
      },
      { buildLogRepository }
    );

    await publicarBuildLog(log.id, { buildLogRepository });
    const logFinal = await buildLogRepository.buscarPorId(log.id);
    expect(logFinal?.status).toBe("publicado");
    expect(logFinal?.dataPublicacao).not.toBeNull();
  });

  it("Critério de Lançamento: só satisfeito por confirmação humana explícita (SOM Cap. 7.2)", async () => {
    const projeto = await criarProjeto(
      { nome: "Albatroz OS", tipo: "produto_proprio" },
      { projetoRepository }
    );

    const criterio = await criarCriterioDeLancamento(
      { projetoId: projeto.id, descricaoFeature: "Kanban de pipeline" },
      { projetoRepository }
    );
    expect(criterio.status).toBe("pendente");

    await satisfazerCriterioDeLancamento(criterio.id, { projetoRepository });
    const criterioFinal = await projetoRepository.buscarCriterioPorId(criterio.id);
    expect(criterioFinal?.status).toBe("satisfeito");
    expect(criterioFinal?.dataConfirmacao).not.toBeNull();
  });
});
