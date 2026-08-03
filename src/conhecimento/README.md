# Conhecimento

**Status:** implementado na Sprint 7.

## Responsabilidade

Biblioteca de raciocínio da marca: Frameworks, Temas Mapeados, Regras de Decisão (Reference Data, populados com o conteúdo exato do SOM Cap. 2), e Ativos de Conhecimento (Banco de Perguntas Recorrentes + Banco de Analogias).

## Entidades

Framework, TemaMapeado, RegraDeDecisao (Reference Data); AtivoDeConhecimento (Entity)

## Sprint de implementação

Sprint 7 (IMPLEMENTATION_PLAN.md).

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo, e `docs/ARCHITECTURE.md` (seção 4) para sua posição entre os Bounded Contexts do sistema.

## Decisão de governança registrada — AB-004 (proposto)

O SOM.md, Capítulo 2.5 (Mapa de Temas — única enumeração formal de temas no documento de maior precedência), lista exatamente **12 temas**, não 18 como SOFTWARE_SPEC.md, DOMAIN_MODEL.md e IMPLEMENTATION_PLAN.md mencionam repetidamente. Esta Sprint semeou os 12 temas literais do SOM.md, por ser o documento de maior precedência (ENGINEERING_MANIFEST.md). Recomenda-se revisão documental futura para eliminar a menção a "18 temas" nos demais documentos congelados.
