import { describe, it, expect } from "vitest";
import {
  DrizzleDocumentoOficialRepository,
  DrizzleDocumentoChunkRepository,
} from "@/brand_intelligence/infrastructure/brand-intelligence-repository";
import { registrarDocumentoOficial, DocumentoJaCadastradoError } from "@/brand_intelligence/application/registrar-documento-oficial";
import { verificarAtualizacaoDoDocumento } from "@/brand_intelligence/application/verificar-atualizacao-do-documento";
import { sincronizarDocumento } from "@/brand_intelligence/application/sincronizar-documento";
import { buscarContextoRelevante } from "@/brand_intelligence/application/consultor-de-brand-intelligence";
import { FakePortaDeDrive } from "../../unit/brand_intelligence/_fakes/fake-porta-de-drive";

describe("Fluxo completo de Brand Intelligence (integração)", () => {
  const documentoOficialRepository = new DrizzleDocumentoOficialRepository();
  const documentoChunkRepository = new DrizzleDocumentoChunkRepository();

  it("não permite registrar duas vezes o mesmo arquivo do Google Drive", async () => {
    const fileId = `drive-id-${Date.now()}`;

    await registrarDocumentoOficial(
      { titulo: "SOM.md", googleDriveFileId: fileId, tipoDocumento: "sistema_operacional_marca" },
      { documentoOficialRepository }
    );

    await expect(
      registrarDocumentoOficial(
        { titulo: "SOM.md (duplicado)", googleDriveFileId: fileId, tipoDocumento: "sistema_operacional_marca" },
        { documentoOficialRepository }
      )
    ).rejects.toThrow(DocumentoJaCadastradoError);
  });

  it("Critério de Aceite: o SOM.md pode ser sincronizado e aparece como indexado", async () => {
    const portaDeDrive = new FakePortaDeDrive();
    portaDeDrive.proximoConteudo =
      "Filosofia: nenhuma empresa deixa de crescer por falta de solução.\n\nBig Idea: toda empresa carrega uma mentira confortável.";

    const documento = await registrarDocumentoOficial(
      { titulo: "SOM.md", googleDriveFileId: `drive-som-${Date.now()}`, tipoDocumento: "sistema_operacional_marca" },
      { documentoOficialRepository }
    );
    expect(documento.statusIndexacao).toBe("nao_indexado");

    const resultado = await sincronizarDocumento(documento.id, {
      documentoOficialRepository,
      documentoChunkRepository,
      portaDeDrive,
    });
    expect(resultado.sucesso).toBe(true);
    expect(resultado.totalChunks).toBeGreaterThan(0);

    const documentoAtualizado = await documentoOficialRepository.buscarPorId(documento.id);
    expect(documentoAtualizado?.statusIndexacao).toBe("indexado");
    expect(documentoAtualizado?.hashConteudo).not.toBeNull();
    expect(documentoAtualizado?.ultimaSincronizacao).not.toBeNull();
  });

  it("Critério de Aceite: uma mudança no documento de origem é detectada e marca 'desatualizado'", async () => {
    const portaDeDrive = new FakePortaDeDrive();
    portaDeDrive.proximoConteudo = "Conteúdo original da versão 1.";

    const documento = await registrarDocumentoOficial(
      { titulo: "Manual da Marca", googleDriveFileId: `drive-manual-${Date.now()}`, tipoDocumento: "manual_marca" },
      { documentoOficialRepository }
    );

    await sincronizarDocumento(documento.id, { documentoOficialRepository, documentoChunkRepository, portaDeDrive });
    const aposPrimeiraSincronizacao = await documentoOficialRepository.buscarPorId(documento.id);
    expect(aposPrimeiraSincronizacao?.statusIndexacao).toBe("indexado");

    // Conteúdo muda na origem (Google Drive).
    portaDeDrive.proximoConteudo = "Conteúdo COMPLETAMENTE DIFERENTE da versão 2.";

    const verificacao = await verificarAtualizacaoDoDocumento(documento.id, {
      documentoOficialRepository,
      portaDeDrive,
    });
    expect(verificacao.mudancaDetectada).toBe(true);

    const aposVerificacao = await documentoOficialRepository.buscarPorId(documento.id);
    expect(aposVerificacao?.statusIndexacao).toBe("desatualizado");
  });

  it("Critério de Aceite: falha de sincronização nunca bloqueia — resulta em status 'erro', sem lançar exceção", async () => {
    const portaDeDrive = new FakePortaDeDrive();
    portaDeDrive.proximoConteudo = "Conteúdo inicial.";

    const documento = await registrarDocumentoOficial(
      { titulo: "Documento com falha", googleDriveFileId: `drive-falha-${Date.now()}`, tipoDocumento: "outro" },
      { documentoOficialRepository }
    );

    portaDeDrive.deveFalhar = true;

    // Nenhuma das duas chamadas deve lançar exceção — falha é
    // tratada internamente (ARCHITECTURE.md, seção 18).
    const resultadoVerificacao = await verificarAtualizacaoDoDocumento(documento.id, {
      documentoOficialRepository,
      portaDeDrive,
    });
    expect(resultadoVerificacao.sucesso).toBe(false);

    const resultadoSincronizacao = await sincronizarDocumento(documento.id, {
      documentoOficialRepository,
      documentoChunkRepository,
      portaDeDrive,
    });
    expect(resultadoSincronizacao.sucesso).toBe(false);

    const documentoFinal = await documentoOficialRepository.buscarPorId(documento.id);
    expect(documentoFinal?.statusIndexacao).toBe("erro");
  });

  it("ConsultorDeBrandIntelligence recupera chunks relevantes por busca textual", async () => {
    const portaDeDrive = new FakePortaDeDrive();
    const marcador = `marcador-unico-${Date.now()}`;
    portaDeDrive.proximoConteudo = `Parágrafo irrelevante sobre outra coisa.\n\nEste parágrafo contém o ${marcador} que buscamos.`;

    const documento = await registrarDocumentoOficial(
      { titulo: "Documento para busca", googleDriveFileId: `drive-busca-${Date.now()}`, tipoDocumento: "outro" },
      { documentoOficialRepository }
    );
    await sincronizarDocumento(documento.id, { documentoOficialRepository, documentoChunkRepository, portaDeDrive });

    const resultados = await buscarContextoRelevante(marcador, { documentoChunkRepository });
    expect(resultados.length).toBeGreaterThan(0);
    expect(resultados[0]?.conteudoChunk).toContain(marcador);
  });
});
