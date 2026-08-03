# Clientes

**Status:** implementado na Sprint 4.

## Responsabilidade

Relacionamento comercial e sua classificação via árvore de decisão do SOM Cap. 7.1 (autoridade real, aceita diagnóstico, sinal de não-cumprimento). Nasce exclusivamente da conversão de um Lead (Pipeline Comercial) — nunca criado diretamente sem esse processo nesta versão.

## Entidades

Cliente (Aggregate Root)

## Sprint de implementação

Sprint 4 (IMPLEMENTATION_PLAN.md).

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo, e `docs/ARCHITECTURE.md` (seção 4) para sua posição entre os Bounded Contexts do sistema. Coluna `origem_lead_id` foi adicionada nesta Sprint como decisão de engenharia (preenche lacuna de coluna do DATABASE.md original) — ver relatório da Sprint 4.
