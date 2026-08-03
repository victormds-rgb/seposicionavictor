# Agenda

**Status:** implementado na Sprint 3.

## Responsabilidade

Organização temporal — reuniões agendadas e a rotina semanal fixa (SOM Cap. 9.4). O mecanismo de "notificação básica de ausência" da Sprint 3 é implementado via a transição de status `agendado → perdido` (evento `item_agenda.perdido`, já catalogado no domínio), sem depender do Bounded Context Notificações (Sprint 9).

## Entidades

ItemDeAgenda (Aggregate Root)

## Sprint de implementação

Sprint 3 (IMPLEMENTATION_PLAN.md).

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo, e `docs/ARCHITECTURE.md` (seção 4) para sua posição entre os Bounded Contexts do sistema. `tarefa_id` ainda sem FK real (Bounded Context Tarefas ainda não implementado).
