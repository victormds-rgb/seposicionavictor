# docs/

Referência versionada da documentação normativa congelada (ARCHITECTURE.md, seção 22; ENGINEERING_MANIFEST.md).

## Documentos presentes (todos versionados)

1. START_HERE.md (operacional, onboarding)
2. ENGINEERING_MANIFEST.md
3. SOM.md
4. SOFTWARE_SPEC.md
5. DOMAIN_MODEL.md
6. DATABASE.md
7. ARCHITECTURE.md
8. UI_UX.md
9. INTERACTION_MODEL.md
10. INFORMATION_ARCHITECTURE.md
11. CODING_GUIDELINES.md
12. IMPLEMENTATION_PLAN.md

## Ordem de precedência normativa

Definida em ENGINEERING_MANIFEST.md: SOM.md → SOFTWARE_SPEC.md → DOMAIN_MODEL.md → DATABASE.md → ARCHITECTURE.md → UI_UX.md → INTERACTION_MODEL.md → INFORMATION_ARCHITECTURE.md. IMPLEMENTATION_PLAN.md e CODING_GUIDELINES.md são documentos de engenharia, subordinados aos anteriores, sem alterar decisões de produto ou arquitetura.

Em caso de conflito entre documentos, vence o de maior precedência nesta ordem.

## Nota sobre DOMAIN_MODEL.md

DOMAIN_MODEL.md registra a modelagem original do domínio. Uma revisão arquitetural subsequente (registrada no histórico do projeto, anterior à geração do DATABASE.md) simplificou a classificação de algumas entidades — ver nota de precedência no topo do próprio DOMAIN_MODEL.md. Em qualquer divergência de classificação técnica (Aggregate Root vs. Reference Data, por exemplo), **DATABASE.md prevalece**, pois reflete o estado pós-revisão.
