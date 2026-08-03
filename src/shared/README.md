# Shared Kernel

**Status:** ainda não implementado nesta fase (Bounded Context reservado).

## Responsabilidade

Tipos, enums e Value Objects genuinamente compartilhados entre múltiplos Bounded Contexts. Uso excepcional, não regra — evitar que vire acoplamento oculto.

## Entidades

FormatoDeCase, FormatoDeBuildLog (Value Objects), enums de estado comuns

## Sprint prevista (IMPLEMENTATION_PLAN.md)

Sprint Conforme necessidade real surgir em cada Sprint.

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo desta entidade/contexto, e `docs/ARCHITECTURE.md` (seção 4) para sua posição entre os Bounded Contexts do sistema. Nenhuma regra de negócio deve ser implementada nesta pasta antes da Sprint correspondente, salvo o que já estiver explicitamente registrado como exceção (ex: schema/seed do Fundamento na Sprint 0).
