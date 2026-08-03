# Cases

**Status:** implementado na Sprint 5.

## Responsabilidade

Prova pública estruturada e imutável em seu histórico (SOM Cap. 5.1) — o ativo de maior valor de marca. Nasce como snapshot dos 6 campos do Projeto de origem; toda edição posterior gera entrada em `case_historico` (append-only, nunca editado ou apagado).

## Entidades

Case (Aggregate Root), CaseHistorico

## Sprint de implementação

Sprint 5 (IMPLEMENTATION_PLAN.md).

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo, e `docs/ARCHITECTURE.md` (seção 4) para sua posição entre os Bounded Contexts do sistema.
