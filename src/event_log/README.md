# Observabilidade (event_log)

**Status:** implementado e em uso ativo desde a Sprint 0 — não é mais um Bounded Context reservado.

## Responsabilidade

Log de observabilidade de domínio — não é Event Sourcing (ADR-003). Todo
evento publicado por qualquer Bounded Context, via `InProcessEventDispatcher`
(ADR-002), é persistido aqui por `EventLogHandler`, sem exceção — não há
lógica de "quando/o que registrar por contexto": todo evento vira uma
linha em `event_log`.

## O que existe

- `infrastructure/eventLogRepository.ts` — `EventLogHandler` (implementa
  `IEventHandler`), grava cada evento recebido em `event_log`.
- `infrastructure/composicao.ts` — `criarEventDispatcher()`, a fábrica
  central que todo Bounded Context usa para obter seu `IEventPublisher`
  (nunca instanciam `InProcessEventDispatcher` diretamente). Registrar um
  novo handler global é acrescentá-lo aqui, sem tocar nenhum outro
  contexto.
- `application/` — vazio (só `.gitkeep`). Não há Use Case próprio deste
  contexto: sua única responsabilidade é a persistência do log, que já
  está inteiramente coberta pelo handler acima.

## Entidades

`event_log` (tabela, Entity de log — nunca editada ou apagada)

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo
desta entidade/contexto, e `docs/ARCHITECTURE.md` (seção 10, "Estratégia
de Eventos") para sua posição na arquitetura de eventos do sistema.
