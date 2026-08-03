# Sistema Operacional da Marca

**Status:** ainda não implementado nesta fase (Bounded Context reservado).

## Responsabilidade

Guardar o Fundamento — a constituição imutável da marca (filosofia, Big Idea, frase-âncora, manifesto, princípios operacionais). Já parcialmente implementado: schema e seed em infra/persistence/db (Sprint 0). Domain/Application ainda vazios.

## Entidades

Fundamento (Aggregate Root)

## Sprint prevista (IMPLEMENTATION_PLAN.md)

Sprint 0 (parcial — schema/seed) e futuras (regras de edição/revisão).

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo desta entidade/contexto, e `docs/ARCHITECTURE.md` (seção 4) para sua posição entre os Bounded Contexts do sistema. Nenhuma regra de negócio deve ser implementada nesta pasta antes da Sprint correspondente, salvo o que já estiver explicitamente registrado como exceção (ex: schema/seed do Fundamento na Sprint 0).
