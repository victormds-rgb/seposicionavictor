# Projetos

**Status:** implementado na Sprint 5.

## Responsabilidade

Trabalho concreto — cliente externo ou produto próprio — com os 6 campos de formato de case (SOM Cap. 5.1) desde o dia 1. Núcleo de execução que conecta Clientes (Sprint 4) a Cases e Build Logs.

## Entidades

Projeto (Aggregate Root), CriterioDeLancamento (entidade interna, Cap. 7.2)

## Sprint de implementação

Sprint 5 (IMPLEMENTATION_PLAN.md).

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo, e `docs/ARCHITECTURE.md` (seção 4) para sua posição entre os Bounded Contexts do sistema. `cliente_id` agora referencia formalmente `cliente.id` (FK real desde esta Sprint).
