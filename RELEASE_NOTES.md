# Release Notes

## Versão

`0.1.0` — Release Candidate (Sprint 16, "Release Candidate")

## Data

2026-08-04

## Status

Homologado como **pronto para produção** ao final da Sprint 15 ("Green
Deploy") e confirmado nesta Sprint 16 sem novas alterações de código —
apenas documentação de release e revalidação.

---

## Principais funcionalidades

Sistema pessoal de execução do Sistema Operacional da Marca (SOM) de Victor
Sousa — usuário único, sem multi-tenant, sem produto comercial.

- **Inbox Universal**: captura de texto ou arquivo (até 10MB), classificação
  automática por IA em `SugestaoIA`, confirmação humana obrigatória
  (aceitar/editar/rejeitar) antes de qualquer efeito no domínio.
- **Agenda**: rotina semanal fixa instanciável, agendamento de reuniões,
  marcação de itens vencidos (`perdido`) via Job automático.
- **Pipeline Comercial**: Lead → Qualificação → Agendamento → Reunido →
  Conversão em Cliente, com árvore de decisão de aceite (SOM Cap. 7.1).
- **Projetos, Cases e Build Logs**: dois tipos de projeto (cliente externo /
  produto próprio), critérios de lançamento, histórico de edição de Case.
- **Conteúdo**: criação autônoma ou derivada, árvore de decisão para peça
  sem Case (SOM Cap. 2.6), publicação com contabilização de distribuição de
  Pilares.
- **Conhecimento**: Frameworks, Temas Mapeados, Regras de Decisão, Banco de
  Perguntas Recorrentes e Ativos de Conhecimento — biblioteca de consulta.
- **Brand Intelligence**: Google Drive como fonte oficial de documentos da
  marca, verificação de mudança + sincronização com chunking.
- **Notificações**: `MonitorDeConsistencia` gera Alertas (`build_log_ausente`,
  `desvio_pilares`, `auditoria_devida`); reconhecimento e resolução manual.
- **Healthcheck** (`/health`) público, endurecido para nunca vazar detalhe
  interno.

## Arquitetura

Monolito modular orientado a domínio (DDD) — ver
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) e o
[README](README.md#arquitetura). Camadas por Bounded Context: **Domain**
(regras puras) → **Application** (casos de uso) → **Infrastructure**
(implementações) ← consumida por **Presentation**. Prioriza simplicidade
operacional sobre escalabilidade prematura (ADR-001): banco único, sem
filas distribuídas, sem microsserviços.

### DDD

- **15 Bounded Contexts**: Sistema Operacional da Marca, Conhecimento,
  Reuniões, Agenda, Clientes, Projetos, Cases, Build Logs, Conteúdo,
  Registros Brutos/Inbox, Tarefas, Notificações, IA, Pipeline Comercial,
  Brand Intelligence.
- **15 Aggregate Roots**, um repositório por Aggregate Root (`docs/ARCHITECTURE.md`, seção 9).
- IA nunca escreve diretamente em um Aggregate Root (ADR-005) — toda
  sugestão passa por confirmação humana.
- Evolução por adição, nunca por acoplamento (ADR-007): um novo Bounded
  Context nunca força mudança de semântica em um existente.

### Scheduler

`infra/scheduler/` — Jobs simples (cron-like), sem orquestrador externo.
Dois Jobs disponíveis hoje (`monitor-de-consistencia`,
`atualizar-itens-vencidos`), ambos idempotentes e seguros sob concorrência
(índice único parcial + `UPDATE` otimista + Unit of Work). Executados via
`npm run jobs:run -- <nome>`; em produção, devem ser agendados por um
scheduler externo (ex.: Trigger.dev).

### Event Dispatcher

Eventos de domínio publicados in-process, sem broker externo (ADR-002).
`InProcessEventDispatcher` aciona `IEventHandler`s registrados
diretamente; hoje só `EventLogHandler` (persiste em `event_log` para
observabilidade — **não é Event Sourcing**, ADR-003).

### Unit of Work

`DrizzleUnitOfWork` via `db.transaction` + `AsyncLocalStorage`, propagando
a transação ativa aos repositórios sem parâmetro explícito. Garante que
escrita de Aggregate Root e publicação de evento sejam atômicas onde a
regra de negócio exige (`monitor-de-consistencia`,
`atualizar-itens-vencidos`). Sempre opcional nos `deps` dos Use Cases —
comportamento idêntico quando não usado.

## Testes

- **139 testes unitários e de integração** (Vitest) — `tests/unit/` usa
  fakes/doubles, sem banco; `tests/integration/` roda contra Postgres real,
  incluindo testes dedicados de concorrência (dupla chamada simultânea em
  `marcarComoPerdidoSeAgendado` e `garantirAtivo`, e prova de que Aggregate
  + EventLog participam da mesma transação).
- **12 testes E2E** (Playwright), cobrindo os 7 fluxos principais:
  Autenticação, Inbox, Agenda, Pipeline Comercial, Projetos, Conteúdo,
  Notificações.
- Todas as suítes confirmadas passando de forma reprodutível (execuções
  repetidas, não uma única corrida) antes deste release.

## Dependências principais

| Pacote | Versão |
|---|---|
| next | 16.3.0 |
| react / react-dom | 19.2.8 |
| drizzle-orm | 0.45.2 |
| drizzle-kit | 0.31.10 |
| postgres | 3.4.9 |
| vitest | 4.1.10 |
| @playwright/test | 1.62.1 |
| typescript | 5.x |
| zod | latest ^3.x declarado |

`npm audit`: 4 vulnerabilidades moderadas restantes, todas a mesma
advisory (`GHSA-67mh-4wv8-2f99`) puxada transitivamente pelo `drizzle-kit`
(devDependency, sem versão corrigida publicada — vetor de ataque nunca
ativado pelo uso real do projeto, que só chama `generate`/`migrate` como
comandos pontuais, nunca em modo servidor/watch).

## Breaking changes (nesta janela de releases)

Mudanças de infraestrutura/tooling, **nenhuma de regra de negócio,
domínio, eventos ou payloads**:

- `src/middleware.ts` → `src/proxy.ts` (convenção renomeada pelo Next.js
  16 — mesma função, mesmo comportamento).
- `experimental.middlewareClientMaxBodySize` →
  `experimental.proxyClientMaxBodySize` em `next.config.ts`.
- Limite de upload da Inbox agora efetivamente 10MB (documentado desde o
  início, mas dois limites internos do Next.js — 1MB e 10MB — bloqueavam
  antes da validação de negócio rodar; corrigido).
- Erros de validação de upload agora comunicados via `redirect()` +
  parâmetro de URL, em vez de exceção lançada (necessário para a mensagem
  sobreviver à redação de erro do React em produção).

## Known issues

- **`npm audit`**: 4 vulnerabilidades moderadas sem correção publicada
  upstream (ver seção Dependências). Não bloqueia produção — devDependency,
  vetor de ataque inativo no uso real.
- **`LICENSE` ausente**: decisão de negócio/legal pendente (repositório
  privado sem licença definida vs. licença explícita) — não resolvido
  unilateralmente por não ser uma decisão de engenharia.
- **Google Calendar e Gmail**: não implementados (só o campo de schema
  `googleCalendarEventId` existe, sempre `null`). Google Drive (Brand
  Intelligence) está implementado mas com uma simplificação conhecida: usa
  `GOOGLE_CLIENT_SECRET` como Bearer token direto, não o fluxo OAuth2
  completo (ver [README § Google Workspace](README.md#google-workspace)).
- **Banco de homologação com dados de teste acumulados**: o ambiente usado
  para toda a validação desta release tem meses de dados de E2E/testes
  manuais acumulados. Um ambiente de produção real deve começar de um
  banco limpo (migrations + seed), não copiar o banco de homologação.

## Roadmap

Ver [`ROADMAP.md`](ROADMAP.md).
