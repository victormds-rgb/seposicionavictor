# Observabilidade (event_log)

**Status:** ainda não implementado nesta fase (Bounded Context reservado).

## Responsabilidade

Log de observabilidade de domínio — não é Event Sourcing. Repositório de escrita já implementado na Sprint 0 (src/event_log/infrastructure/eventLogRepository.ts); camada de Application (decidir quando/o que registrar por contexto) ainda pendente.

## Entidades

event_log (tabela, Entity de log)

## Sprint prevista (IMPLEMENTATION_PLAN.md)

Sprint 0 (parcial) e cada Sprint subsequente.

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo desta entidade/contexto, e `docs/ARCHITECTURE.md` (seção 4) para sua posição entre os Bounded Contexts do sistema. Nenhuma regra de negócio deve ser implementada nesta pasta antes da Sprint correspondente, salvo o que já estiver explicitamente registrado como exceção (ex: schema/seed do Fundamento na Sprint 0).
