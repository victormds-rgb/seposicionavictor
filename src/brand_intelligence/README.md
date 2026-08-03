# Brand Intelligence

**Status:** implementado na Sprint 8. Adapter real do Google Drive não exercitado contra a API real (sandbox sem acesso a googleapis.com) — comportamento validado via `FakePortaDeDrive`, incluindo o caminho de falha (crítico para o critério de não-bloqueio).

## Responsabilidade

Trata o Google Drive como fonte oficial de documentos da marca (ADR-004); indexa e disponibiliza contexto para geração de IA via `ConsultorDeBrandIntelligence` (busca textual nesta versão — embeddings reais ficam reservados para uma evolução futura sem mudança de assinatura).

## Entidades

**DocumentoOficial (Aggregate Root)** — único Aggregate Root deste contexto.

**DocumentoChunkIndexado (entidade interna do agregado DocumentoOficial)** — correção de classificação registrada na revisão da Sprint 8: pela modelagem real (sempre derivado da fonte oficial, nunca fonte de verdade própria, substituído por completo a cada sincronização via `substituirChunks`), é análogo a `CaseHistorico` (Sprint 5) — uma entidade interna de suporte, não um Aggregate Root independente. Implementação de código não foi alterada (o padrão de acesso via repositório já era compatível com essa classificação); apenas a documentação e as métricas de engenharia foram corrigidas.

## Sprint de implementação

Sprint 8 (IMPLEMENTATION_PLAN.md).

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo, e `docs/ARCHITECTURE.md` (seções 4, 19 e 21) para sua posição entre os Bounded Contexts do sistema.

## Fluxo de sincronização (dois Use Cases distintos, fiéis a ARCHITECTURE.md §21)

1. `verificarAtualizacaoDoDocumento` — detecta mudança via hash, marca `desatualizado` (sem reindexar).
2. `sincronizarDocumento` — busca conteúdo, faz chunking, substitui chunks, marca `indexado`.

Falha em qualquer etapa nunca lança exceção não tratada — sempre resulta em status `erro` (ARCHITECTURE.md, seção 18).
