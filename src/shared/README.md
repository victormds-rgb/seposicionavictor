# Shared Kernel

**Status:** implementado e em uso ativo por praticamente todos os
Bounded Contexts — não é mais um Bounded Context reservado. Continua
sendo uso excepcional por natureza (evitar acoplamento oculto), mas hoje
concentra as abstrações cross-cutting mais usadas do projeto.

## Responsabilidade

Tipos, interfaces e implementações genuinamente compartilhadas entre
múltiplos Bounded Contexts — nenhuma regra de negócio de um contexto
específico vive aqui.

## O que existe

- `domain/clock.ts` — abstração `Clock` (remove `new Date()` oculto dos
  Use Cases).
- `domain/uuid-generator.ts` — abstração `UuidGenerator` (remove
  `randomUUID()` oculto).
- `domain/i-event-publisher.ts` / `domain/i-event-handler.ts` —
  interfaces do Event Dispatcher in-process (ADR-002).
- `domain/unit-of-work.ts` — interface `UnitOfWork`, usada onde escrita
  de Aggregate Root e publicação de evento precisam ser atômicas.
- `infrastructure/system-clock.ts` / `infrastructure/system-uuid-generator.ts`
  — implementações reais das abstrações acima.
- `infrastructure/in-process-event-dispatcher.ts` — `InProcessEventDispatcher`,
  o Event Dispatcher em si (ver `src/event_log/README.md` para onde ele é
  instanciado).
- `enums/canal.ts`, `enums/tipo-destino.ts` — enums genuinamente
  compartilhados entre contextos (ex.: canal de publicação usado por
  Conteúdo e Cases).
- `ports/`, `value_objects/` — vazios (só `.gitkeep`) — reservados para
  quando/se surgir necessidade real de uma porta ou Value Object
  compartilhado entre contextos; nenhum existe hoje.

## Entidades

Nenhuma — este contexto não tem Aggregate Root próprio, só abstrações e
interfaces cross-cutting.

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo, e
`docs/ARCHITECTURE.md` (seção 4) para sua posição entre os Bounded
Contexts do sistema.
