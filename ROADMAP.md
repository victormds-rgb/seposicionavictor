# Roadmap

Este documento é informativo — organiza itens já registrados em
`docs/ARCHITECTURE.md` (seção 27, "Arquitetura Evolutiva") e no README,
mais lacunas conhecidas encontradas durante a homologação. **Nenhuma
decisão de arquitetura ou domínio é tomada aqui** — qualquer item abaixo
que vire trabalho real precisa passar primeiro pelos documentos congelados
(`docs/`), conforme `docs/ENGINEERING_MANIFEST.md`.

---

## Backlog

Itens explicitamente deixados de fora até aqui (`docs/ARCHITECTURE.md`,
seção 26 — "O Que Foi Deliberadamente Deixado Fora"):

- Multi-tenant, RBAC granular, multiusuário.
- Message broker distribuído, Event Sourcing completo, CQRS.
- Particionamento/sharding de banco.
- Modo offline-first.
- CRM financeiro completo.
- Limite automático de gasto de IA (risco em aberto, sem mitigação implementada).

## Melhorias

Lacunas encontradas durante a homologação (Sprints 14–16), sem impacto de
regra de negócio — candidatas a um ciclo de melhoria futuro:

- **Licenciamento**: definir se o repositório permanece privado sem
  licença, ou recebe uma licença explícita — decisão de negócio pendente
  (ver `RELEASE_NOTES.md`, "Known issues").
- **UX de vinculação Cliente → Projeto**: a tela de Clientes não exibe o
  UUID do cliente em nenhum lugar, exigindo consulta direta ao banco para
  preencher o campo "Cliente (uuid)" do formulário de criação de Projeto.
- **Isolamento de dados de teste**: `tests/integration/**` roda contra um
  Postgres real compartilhado entre arquivos, sem banco dedicado por
  execução — mitigado com `fileParallelism: false`, mas um banco de teste
  efêmero por execução eliminaria a necessidade dessa trava.
- **`npm audit`**: acompanhar quando o `drizzle-kit` publicar uma versão
  sem a dependência vulnerável de `@esbuild-kit` (ver `RELEASE_NOTES.md`).

## Integrações futuras

### Google Drive (Brand Intelligence)

Já implementado, mas com uma simplificação conhecida: o adapter usa
`GOOGLE_CLIENT_SECRET` diretamente como Bearer token, não o fluxo OAuth2
completo (Access Token de curta duração via Refresh Token). Trabalho
futuro: implementar o fluxo de autorização OAuth2 real, com
armazenamento seguro de Refresh Token (provavelmente nova coluna/tabela).
Scope já documentado: `drive.readonly`.

### Google Calendar (Pipeline Comercial)

Não implementado. O campo `agendamento_comercial.googleCalendarEventId`
já existe no schema como opcional, e `agendarComercial` já aceita o campo
sem quebrar quando ausente. Trabalho futuro: chamada real à API do Google
Calendar para criar/editar eventos. Scope necessário:
`calendar.events`.

### Gmail (Inbox — entrada leve)

Não implementado (`infra/integrations/gmail/` só tem um `.gitkeep`).
Previsto como entrada leve na Inbox, não um CRM de e-mail completo.
Scope necessário: `gmail.readonly`.

## IA

Cinco Bounded Contexts futuros já desenhados em `docs/ARCHITECTURE.md`
(seção 27), nenhum implementado ainda. Todos entram por adição
(ADR-007), sem exigir mudança em contexto já congelado:

- **Agents** — agente de IA configurado para executar ações delimitadas,
  sempre gerando `SugestaoIA`, nunca escrita direta em Aggregate Root.
- **Memory** — memória de longo prazo reutilizável entre interações de
  IA, derivada de eventos já publicados (`sugestao.aceita`,
  `sugestao.rejeitada`). Sempre reconstruível a partir do `event_log`,
  nunca fonte de verdade própria.
- **Knowledge Graph** — camada de leitura agregada sobre entidades
  existentes (relações semânticas). Projeção, nunca segunda fonte de
  verdade.
- **Capabilities** — catálogo declarativo do que o sistema/Agent sabe
  fazer; cada Domain Service de IA existente vira, retroativamente, uma
  Capability registrada.
- **Missions** — orquestração de múltiplas etapas/contextos, sem eliminar
  os pontos de confirmação humana já exigidos em cada etapa individual.

## Analytics

Não há Bounded Context de Analytics desenhado nos documentos congelados
hoje. `CalculadoraDeDistribuicaoDePilares` e `MonitorDeConsistencia` já
produzem sinais agregados (desvio de pilar, ausência de Build Log) que
poderiam alimentar um painel de analytics futuro, mas isso exigiria
primeiro uma decisão arquitetural registrada em `docs/ARCHITECTURE.md` —
não é um item de trabalho aberto hoje.

## Dashboard

O Dashboard atual (`/dashboard`) já consulta Agenda do dia, Alertas
ativos, Pendências da Inbox e Distribuição de Pilares. Evoluções aqui
(novos widgets, filtros, período customizável) dependem de decisão de
UX registrada em `docs/UI_UX.md` antes de qualquer implementação — fora
do escopo desta Sprint, que é só documentação.

---

Ver também `docs/IMPLEMENTATION_PLAN.md` para o histórico completo de
Sprints já concluídas.
