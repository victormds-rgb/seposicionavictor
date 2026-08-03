# Pipeline Comercial

**Status:** implementado na Sprint 4. Integração real com Google Calendar não exercitada (sandbox sem acesso à API) — `googleCalendarEventId` aceito como opcional, sem bloquear o fluxo.

## Responsabilidade

Fluxo comercial do primeiro contato (Lead) até a conversão em Cliente — qualificação, agendamento (reaproveita Reuniões/Sprint 3), temperatura, ticket estimado.

## Entidades

Lead (Aggregate Root), QualificacaoLead, AgendamentoComercial

## Sprint de implementação

Sprint 4 (IMPLEMENTATION_PLAN.md).

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo, e `docs/ARCHITECTURE.md` (seções 4 e 20) para sua posição entre os Bounded Contexts do sistema. Nenhum evento de domínio específico de Lead/Qualificação/Agendamento existe na lista fechada de 21 eventos — lacuna documentada no relatório da Sprint 4, não resolvida por invenção de evento novo.
