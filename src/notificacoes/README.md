# Notificações

**Status:** implementado na Sprint 9.

## Responsabilidade

Auto-vigilância da marca (SOM Cap. 8) — Alertas (`build_log_ausente`, `desvio_pilares`, `auditoria_devida`) e Auditoria de Drift trimestral. Autoridade apenas de recomendação, nunca de alteração direta do Fundamento (invariante preservada e testada explicitamente).

## Entidades

Alerta, AuditoriaDeDrift (Aggregate Roots)

## Sprint de implementação

Sprint 9 (IMPLEMENTATION_PLAN.md).

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo, e `docs/ARCHITECTURE.md` (seção 4) para sua posição entre os Bounded Contexts do sistema.

## Decisões de engenharia registradas

- Checklist automatizável da Auditoria de Drift é um **proxy documentado** do SOM Cap. 1.8/2.7 (repetição da frase-âncora + peça autônoma sem tema/framework) — não substitui revisão humana qualitativa completa.
- Limiares concretos onde o SOM só dava faixas: 21 dias (build log ausente), 90 dias (auditoria devida), 30% reaproveitado do limiar já existente (desvio de pilares e falha da auditoria).
- `MonitorDeConsistencia` roda sob demanda (carregamento do Dashboard), sem scheduler real ainda — mesma limitação já registrada nas Sprints 3, 4 e 8.
