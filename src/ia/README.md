# IA / Assistência Inteligente

**Status:** base implementada na Sprint 2 (SugestaoIA, Porta de IA com adapter OpenAI, fluxo aceitar/editar/rejeitar — adapter migrado de OpenRouter para a API oficial da OpenAI na Sprint 31A). Auditoria completa (painel de custos, explicações detalhadas) prevista para a Sprint 9.

## Responsabilidade

Camada de sugestão assistida — nunca escreve diretamente em Aggregate Root (ADR-005). Auditoria de uso (provider, modelo, tokens, custo) já registrada desde a Sprint 2.

## Entidades

SugestaoIA (Entity de log, produzida por Domain Service)

## Sprint de implementação

Base: Sprint 2. Auditoria/explicações completas: Sprint 9 (IMPLEMENTATION_PLAN.md).

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo desta entidade/contexto, e `docs/ARCHITECTURE.md` (seção 4) para sua posição entre os Bounded Contexts do sistema.
