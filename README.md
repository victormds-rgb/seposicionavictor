# SEPosicionaVictor

Sistema pessoal, de usuário único, que opera como camada de execução do
Sistema Operacional da Marca ([`docs/SOM.md`](docs/SOM.md)) de Victor Sousa —
não é uma ferramenta de marca pessoal para terceiros, nem um produto
comercial. Reduz a carga mental de lembrar checklists, prazos e critérios de
decisão manualmente (rotina semanal, formato de case, árvore de aceite de
cliente, alertas de drift de marca), aplicando as regras já definidas no SOM.

Este projeto é dirigido por documentação — ver [`docs/`](docs/). Nenhuma
decisão de domínio, arquitetura, UX ou banco de dados é tomada fora dos
documentos congelados (ordem de precedência completa em
[`docs/ENGINEERING_MANIFEST.md`](docs/ENGINEERING_MANIFEST.md), leitura
obrigatória descrita em [`docs/START_HERE.md`](docs/START_HERE.md)).

**Status:** Sprints 0–16 concluídas (Fundação → Shell → Inbox → Agenda →
Pipeline Comercial → Projetos → Conteúdo → Conhecimento → Brand Intelligence
→ IA → Hardening → Testes E2E → Produção/Operação → Boot → Hardening Final
→ Green Deploy → Release Candidate). Homologado como pronto para produção —
ver [`RELEASE_NOTES.md`](RELEASE_NOTES.md). Ver
[`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) para o roadmap
completo de Sprints.

---

## Sumário

- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Quickstart (do zero em ~15 minutos)](#quickstart-do-zero-em-15-minutos)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Banco de dados](#banco-de-dados)
- [Testes unitários e de integração](#testes-unitários-e-de-integração)
- [Testes E2E](#testes-e2e)
- [Jobs e Scheduler](#jobs-e-scheduler)
- [Event Dispatcher](#event-dispatcher)
- [Unit of Work](#unit-of-work)
- [IA](#ia)
- [Brand Intelligence](#brand-intelligence)
- [Google Workspace](#google-workspace)
- [Produção](#produção)
- [Healthcheck](#healthcheck)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Fluxo arquitetural](#fluxo-arquitetural-de-uma-informação)
- [Regras não-negociáveis](#regras-não-negociáveis)
- [Troubleshooting](#troubleshooting)

---

## Arquitetura

Monolito modular orientado a domínio (DDD), com uma Inbox Universal como
porta de entrada, uma camada de IA assistiva que **nunca decide sozinha**
(ADR-005 — toda sugestão de IA exige confirmação humana antes de escrever em
qualquer Aggregate Root), e um módulo de Brand Intelligence que trata o
Google Drive como fonte oficial de verdade documental. Prioriza simplicidade
operacional sobre escalabilidade — banco único, sem filas distribuídas,
sem microsserviços (ADR-001).

13 Bounded Contexts congelados: Sistema Operacional da Marca, Conhecimento,
Reuniões, Agenda, Clientes, Projetos, Cases, Build Logs, Conteúdo, Registros
Brutos/Inbox, Tarefas, Notificações, IA — mais Pipeline Comercial e Brand
Intelligence. Fonte completa: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Camadas, por Bounded Context: **Domain** (regras puras, sem I/O) →
**Application** (orquestra casos de uso) → **Infrastructure** (implementa
portas) ← consumida por **Presentation**. Regra de dependência:
`Presentation → Application → Domain ← Infrastructure`
([`docs/CODING_GUIDELINES.md`](docs/CODING_GUIDELINES.md)).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS**
- **PostgreSQL via Supabase** (Auth + Storage + Postgres — sem Edge
  Functions, sem lógica de negócio no Supabase)
- **Drizzle ORM** (schema, migrations, query builder)
- **Zod** (validação de entrada)
- **Vitest** (unitário/integração) + **Playwright** (E2E)
- Provedor de IA: **OpenRouter** (abstraído por porta — ver [IA](#ia))
- Deploy alvo: **Vercel**

---

## Quickstart (do zero em ~15 minutos)

Pré-requisitos: Node.js 20+, uma conta Supabase (gratuita) com um projeto
criado, `npm`.

```bash
git clone <url-do-repositório>
cd seposicionavictor
npm install
cp .env.example .env.local
```

Preencha `.env.local` com as credenciais do seu projeto Supabase (ver
[Variáveis de ambiente](#variáveis-de-ambiente) — só `DATABASE_URL`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e
`SUPABASE_SERVICE_ROLE_KEY` são obrigatórias para rodar localmente).

No painel do Supabase, crie o bucket de Storage (**Storage → New bucket**,
nome `inbox-arquivos`, ou o nome que você colocou em
`SUPABASE_STORAGE_BUCKET_INBOX`) — **migrations não criam buckets**, é o
único passo manual fora do terminal.

```bash
npm run db:migrate   # aplica o schema (migrations/*.sql)
npm run db:seed      # semeia Fundamento, Pilares, Séries Fixas, Conhecimento
npm run dev           # http://localhost:3000
```

Crie um usuário para logar (painel Supabase → **Authentication → Users →
Add user**, ou pela própria tela de login se o projeto tiver signup
habilitado) e acesse `http://localhost:3000`. Confirme que subiu de verdade
em `http://localhost:3000/health` (ver [Healthcheck](#healthcheck)).

Isso é tudo — sem `OPENROUTER_API_KEY` nem credenciais do Google, o sistema
roda por completo (a classificação por IA cai em modo fake fora de produção,
ver [IA](#ia); as integrações Google ainda não estão implementadas, ver
[Google Workspace](#google-workspace)).

---

## Variáveis de ambiente

Única fonte de configuração: [`config/env.ts`](config/env.ts) (validado por
Zod, nenhum outro arquivo lê `process.env` diretamente —
`docs/CODING_GUIDELINES.md`, seção 6/11). Se qualquer variável obrigatória
estiver ausente ou inválida, a aplicação **não sobe** — a exceção lançada
lista exatamente quais variáveis faltam e por quê (não é preciso adivinhar
lendo o log do servidor).

Template completo com comentários: [`.env.example`](.env.example).

### 1. Database — obrigatória

| Variável | Obrigatória | Onde obter |
|---|---|---|
| `DATABASE_URL` | sim | Painel Supabase → Project Settings → Database → Connection string (URI) |
| `DATABASE_POOL_MAX` | não | Tamanho máximo do pool de conexões — ver [Pool de conexões](#pool-de-conexões) |

#### Pool de conexões

O driver (`postgres-js`, em [`infra/persistence/db/client.ts`](infra/persistence/db/client.ts))
ajusta o pool automaticamente com base em `NODE_ENV`:

- **Desenvolvimento** (`NODE_ENV !== "production"`): `max: 10`, `prepare: true`
  — mesmo comportamento de sempre, sem nenhuma mudança.
- **Produção** (`NODE_ENV === "production"`): `max: 1`, `prepare: false` —
  pensado para runtimes serverless (cada instância/lambda mantém no máximo
  1 conexão, evitando esgotar o limite de conexões do Postgres/pooler do
  Supabase quando múltiplas instâncias sobem em paralelo).
- `DATABASE_POOL_MAX` sobrescreve o `max` em qualquer ambiente, se definida.

Nenhuma URL é hardcoded — o pool sempre usa `DATABASE_URL`.

### 2. Supabase — obrigatória

| Variável | Obrigatória | Onde obter |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | sim | Painel Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sim | Painel Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | sim | Painel Supabase → Project Settings → API (chave privada, nunca no client) |
| `SUPABASE_STORAGE_BUCKET_INBOX` | não (default `inbox-arquivos`) | Precisa existir de verdade — criado manualmente no painel, **não** por migration |

### 3. OpenRouter — opcional

| Variável | Obrigatória | Onde obter |
|---|---|---|
| `OPENROUTER_API_KEY` | não | [openrouter.ai/keys](https://openrouter.ai) |

Sem ela: em produção (`NODE_ENV=production`), a classificação da Inbox
lança erro. Fora de produção, cai automaticamente em modo fake — ver
[IA](#ia).

### 4. Google Workspace — opcional, documentação em [Google Workspace](#google-workspace)

| Variável | Obrigatória | Onde obter |
|---|---|---|
| `GOOGLE_CLIENT_ID` | não | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | não | Google Cloud Console → Credentials |

### 5. Playwright / E2E — opcional, só para `npm run test:e2e`

| Variável | Obrigatória | Onde obter |
|---|---|---|
| `E2E_USER_EMAIL` | só para E2E | usuário real do Supabase Auth, criado manualmente (ver [Testes E2E](#testes-e2e)) |
| `E2E_USER_PASSWORD` | só para E2E | senha do mesmo usuário |

### 6. Runtime

| Variável | Obrigatória | Padrão |
|---|---|---|
| `NODE_ENV` | não | `development` — o Next.js já define automaticamente (`development` em `next dev`, `production` em `next build`/`next start`); normalmente você não precisa setar isso à mão |

---

## Banco de dados

```bash
npm install
npm run db:migrate    # aplica migrations/*.sql (schema é a fonte de verdade — docs/DATABASE.md)
npm run db:seed       # idempotente: roda de novo sem duplicar dados
npm run dev
```

Nenhum passo escondido além do já citado no Quickstart (criar o bucket de
Storage manualmente). `db:seed` é seguro para rodar mais de uma vez —
cada função de seed verifica se o dado já existe antes de inserir.

Para alterar o schema: edite `docs/DATABASE.md` **primeiro** (fonte de
verdade de negócio), depois `infra/persistence/db/schema/*.ts`, depois gere
a migration:

```bash
npm run db:generate   # não precisa de conexão real — só diffa contra migrations/meta/
npm run db:migrate    # aplica de verdade
```

### Dependências implícitas (documentadas nesta Sprint)

- **Bucket de Storage** (`SUPABASE_STORAGE_BUCKET_INBOX`) precisa ser criado
  manualmente no painel Supabase — nenhuma migration ou seed cria buckets.
- **Usuário de login** precisa ser criado manualmente no Supabase Auth — o
  sistema é single-user, não tem tela de cadastro própria.
- **Reference Data** (Pilares, Séries Fixas, Frameworks, Temas, Regras de
  Decisão) só existe depois de `npm run db:seed` — sem isso, telas como
  Conteúdo (`<select>` de Pilar) ficam vazias.
- **Upload de arquivos (Inbox)**: limite de 10MB por arquivo, validado em
  `capturarArquivoAction` antes de carregar o conteúdo em memória
  (`src/app/(shell)/inbox/actions.ts`) — acima disso, mensagem amigável de
  erro. O nome original do arquivo é sanitizado antes de compor o caminho
  no Storage (`sanitizarNomeDeArquivo`, em
  `src/inbox/infrastructure/armazenamento-supabase.ts`), removendo `/`,
  `\`, sequências `..` e caracteres de controle.

---

## Testes unitários e de integração

```bash
npm run test           # roda tudo (tests/unit + tests/integration)
npm run test:watch     # modo watch
```

`tests/unit` não depende de banco (usa fakes/doubles). `tests/integration`
precisa de `DATABASE_URL` real com migrations aplicadas — sem isso, essas
suítes falham na inicialização (env inválida), não silenciosamente.

`tests/integration` inclui testes de concorrência que disparam duas
chamadas simultâneas (`Promise.all`) contra o mesmo agregado, validando que
apenas uma escrita e um evento acontecem mesmo sob corrida — ver
`tests/integration/agenda/fluxo-completo.test.ts` (`marcarComoPerdidoSeAgendado`)
e `tests/integration/notificacoes/fluxo-completo.test.ts` (`garantirAtivo`,
e a garantia de que Aggregate + EventLog participam da mesma transação via
`DrizzleUnitOfWork`).

## Testes E2E

Suíte completa em [`tests/e2e/`](tests/e2e/) (Playwright), cobrindo os 7
fluxos principais: Autenticação, Inbox, Agenda, Pipeline Comercial,
Projetos, Conteúdo, Notificações.

```bash
npm run test:e2e
```

### O que você precisa antes de rodar

1. **Banco configurado e migrado/semeado** — mesmos passos do
   [Quickstart](#quickstart-do-zero-em-15-minutos).
2. **Um usuário real do Supabase Auth** para os testes autenticarem — crie
   um usuário dedicado (painel → Authentication → Users → Add user, ex.:
   `e2e@seuprojeto.local`) e exporte:
   ```bash
   E2E_USER_EMAIL=e2e@seuprojeto.local
   E2E_USER_PASSWORD=senha-forte-qualquer
   ```
   Nunca use um usuário de produção — a suíte cria e altera dados de
   verdade (Leads, Projetos, Peças, Reuniões, Alertas...) com nomes
   prefixados `E2E ...` para não colidir com dados reais.
3. **`npm run test:e2e`** sobe o `next dev` sozinho
   (`webServer` em `playwright.config.ts`) — não precisa rodar `npm run dev`
   à parte.

### Login

O primeiro projeto do Playwright (`setup`, ver `tests/e2e/auth.setup.ts`)
loga uma vez com `E2E_USER_EMAIL`/`E2E_USER_PASSWORD` e salva a sessão
(`tests/e2e/.auth/user.json`, git-ignorado) — os demais specs reaproveitam
essa sessão. O spec de Autenticação (`tests/e2e/auth/autenticacao.spec.ts`)
roda num projeto à parte, sem sessão, porque precisa testar o login do
zero.

### OpenRouter — modo fake automático

`OPENROUTER_API_KEY` **não é obrigatória** para rodar os E2E. Fora de
produção (`NODE_ENV !== "production"` — que é sempre o caso quando o
`webServer` do Playwright sobe via `next dev`), se a chave estiver ausente,
`src/inbox/infrastructure/composicao.ts` usa
`FakeLocalPortaDeIA` (`src/ia/infrastructure/providers/fake-local-porta-de-ia.ts`)
em vez de `OpenRouterPortaDeIA` — classificação determinística, sem rede,
sem custo. **Essa troca nunca acontece em produção**: em produção, a
ausência da chave continua lançando o mesmo erro de sempre.

Se `OPENROUTER_API_KEY` estiver configurada, os mesmos testes passam
usando a API real, sem nenhuma mudança — nenhuma asserção depende do texto
exato da sugestão.

### Limitações conhecidas (ver relatório completo da Sprint 11)

- O fluxo de Notificações não tem gatilho via UI (removido deliberadamente
  no Hardening) — o teste chama o Job diretamente
  (`npm run jobs:run -- monitor-de-consistencia`), do mesmo jeito que um
  scheduler externo chamaria.
- Qual alerta esse Job gera depende do estado real do banco de teste — o
  teste pula com mensagem clara se nenhum alerta resolvível manualmente for
  gerado.

---

## Jobs e Scheduler

`infra/scheduler/` — Scheduler simples (cron-like), sem orquestrador
complexo (`docs/ARCHITECTURE.md`, seção 12). Cada Job é uma função
`async () => resultado`, independente de interface, sem acoplamento a
nenhuma ferramenta de agendamento específica.

```bash
npm run jobs:run -- <nome-do-job>
npm run jobs:run -- monitor-de-consistencia
npm run jobs:run -- atualizar-itens-vencidos
```

Registro central: [`infra/scheduler/jobs/index.ts`](infra/scheduler/jobs/index.ts).
Jobs disponíveis hoje:

| Job | O que faz |
|---|---|
| `monitor-de-consistencia` | Gera/atualiza Alertas (`build_log_ausente`, `desvio_pilares`, `auditoria_devida`) |
| `atualizar-itens-vencidos` | Marca ItemDeAgenda vencido como `perdido` |

Ambos são idempotentes e seguros para execução concorrente (índice único
parcial + `UPDATE` otimista + Unit of Work — ver Hardening). Em produção,
esses Jobs devem ser agendados por um scheduler externo (Trigger.dev ou
equivalente) chamando as mesmas funções de `infra/scheduler/jobs/` — nenhum
deles roda mais durante o carregamento de página (Dashboard/Agenda só
consultam dados).

## Event Dispatcher

Eventos de domínio são publicados **in-process**, sem broker externo, sem
fila (ADR-002):

```
Application → IEventPublisher → InProcessEventDispatcher
                                     ├── EventLogHandler (grava event_log)
                                     └── futuros handlers
```

`InProcessEventDispatcher` (`src/shared/infrastructure/in-process-event-dispatcher.ts`)
aciona cada `IEventHandler` registrado diretamente. Hoje só existe um
handler — `EventLogHandler` — que persiste o evento em `event_log`
(observabilidade pura, **não é Event Sourcing**, ADR-003). Registro central
de handlers: `infra/event_log/infrastructure/composicao.ts` (`criarEventDispatcher`).
Novos handlers entram por adição a essa lista, sem alterar nenhum Use Case
existente.

## Unit of Work

`db.transaction` (Postgres), com `AsyncLocalStorage` propagando a
transação ativa para os repositórios via `getDb()` — sem precisar passar a
transação como parâmetro explícito por toda a cadeia de chamadas. Hoje
usado onde a escrita do Aggregate e a publicação do evento precisam ser
atômicas (ver `src/notificacoes/application/monitor-de-consistencia.ts` e
`src/agenda/application/atualizar-itens-vencidos.ts`). `unitOfWork` é
sempre opcional nos `deps` dos Use Cases — sem ele, o comportamento é
idêntico ao de antes da Unit of Work existir.

---

## IA

Toda chamada de IA passa por uma porta (`PortaDeIA`,
`src/ia/domain/porta-de-ia.ts`), abstraindo o provider — Domain e
Application nunca conhecem OpenRouter diretamente
(`docs/ARCHITECTURE.md`, seção 13). Toda sugestão de IA vira uma
`SugestaoIA` auditável (provider, modelo, tokens, custo) e **nunca escreve
diretamente em um Aggregate Root** — sempre passa por confirmação humana
(ADR-005; `responderSugestao`, `aceitar/editar/rejeitar`).

- **Produção**: `OpenRouterPortaDeIA` (`src/ia/infrastructure/providers/openrouter-provider.ts`) — chamada real à API da OpenRouter. Requer `OPENROUTER_API_KEY`.
- **Desenvolvimento/teste, sem a chave**: `FakeLocalPortaDeIA` (`src/ia/infrastructure/providers/fake-local-porta-de-ia.ts`) — classificação determinística e local, sem rede. A escolha entre os dois é feita em `src/inbox/infrastructure/composicao.ts`, gateada por `NODE_ENV !== "production"`; em produção o comportamento é sempre o mesmo de antes.

## Brand Intelligence

Trata o Google Drive como fonte oficial de documentos da marca (ADR-004).
Fluxo de sincronização, em dois Use Cases distintos
(`docs/ARCHITECTURE.md`, seção 21):

1. `verificarAtualizacaoDoDocumento` — detecta mudança via hash, marca
   `desatualizado` (sem reindexar ainda).
2. `sincronizarDocumento` — busca conteúdo (`PortaDeDrive`), faz chunking,
   substitui os chunks antigos por completo, marca `indexado`.

Falha em qualquer etapa nunca lança exceção não tratada — sempre vira
status `erro`, sem bloquear o resto do sistema. `ConsultorDeBrandIntelligence`
injeta esse contexto em gerações de IA; divergência com o Manual da Marca é
sinalizada, nunca bloqueio automático absoluto. Ver [Google Workspace](#google-workspace)
para o estado real (não simulado) da integração com o Drive.

---

## Google Workspace

**Nenhuma integração nova foi implementada nesta Sprint — isto é
documentação operacional do que já existe em código.**

### Google Drive (Brand Intelligence)

- Adapter: `src/brand_intelligence/infrastructure/providers/google-drive-provider.ts`.
- Uso: buscar o conteúdo de um `documento_oficial` (`googleDriveFileId`) via
  `GET https://www.googleapis.com/drive/v3/files/{id}/export?mimeType=text/plain`.
- **Estado real, não é OAuth2 completo**: o adapter hoje envia
  `GOOGLE_CLIENT_SECRET` diretamente como Bearer token. Isso **não é** o
  fluxo OAuth2 real (que exigiria um Access Token de curta duração obtido
  via um Refresh Token trocado num fluxo de autorização) — é uma
  simplificação de código já existente antes desta Sprint. Corrigir isso é
  fora do escopo desta Sprint (só documentação operacional, sem nova
  implementação) — fica registrado aqui para quem for implementar o OAuth2
  de verdade.
- Scope necessário (quando o OAuth2 real for implementado):
  `https://www.googleapis.com/auth/drive.readonly` (leitura apenas — o
  sistema nunca escreve no Drive).
- Sem `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`: `GoogleDrivePortaDeDrive`
  lança `FalhaDeSincronizacaoError`, que `sincronizarDocumento` converte em
  status `erro` — nunca derruba o resto do sistema (ARCHITECTURE.md, seção
  18).

### Google Calendar (Pipeline Comercial)

- **Não implementado no código.** `agendamento_comercial.googleCalendarEventId`
  existe no schema (`docs/DATABASE.md`) e no Use Case `agendarComercial`
  como campo opcional, mas nenhuma chamada real à API do Google Calendar
  existe hoje — o campo fica `null` quando não fornecido, sem bloquear o
  agendamento.
- Quando for implementado: scope necessário
  `https://www.googleapis.com/auth/calendar.events` (criar/editar eventos).

### Gmail (Inbox — entrada leve)

- **Não implementado no código** (`infra/integrations/gmail/` só tem um
  `.gitkeep`). Previsto como "entrada leve na Inbox, não CRM de e-mail
  completo" (`docs/ARCHITECTURE.md`, seção 19).
- Quando for implementado: scope necessário
  `https://www.googleapis.com/auth/gmail.readonly` (leitura apenas).

### Como obter `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`

1. [Google Cloud Console](https://console.cloud.google.com/) → criar/selecionar um projeto.
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
3. Tipo de aplicação: Web application.
4. Habilitar as APIs necessárias em **APIs & Services → Library**: Google
   Drive API (já usada hoje) e, quando implementados, Google Calendar API e
   Gmail API.
5. Guardar `Client ID` e `Client secret` em `.env.local` — nunca commitados
   (já cobertos por `.gitignore`).

### Tokens e Secrets

- `GOOGLE_CLIENT_SECRET` nunca deve ser exposto ao client (só lido em
  Infrastructure, via `config/env.ts` — `docs/CODING_GUIDELINES.md`, seção
  11).
- Não há, hoje, armazenamento de Refresh Token de usuário (não existe fluxo
  OAuth2 de autorização implementado) — é um ponto em aberto para quando a
  integração real for construída (provavelmente uma nova coluna/tabela,
  fora do escopo desta Sprint, que é só operacional).

---

## Produção

```bash
npm run build   # Turbopack (padrão desde o Next.js 16), inclui typecheck e geração das páginas
npm start       # next start — sobe o build de produção
```

`NODE_ENV=production` é setado automaticamente pelo próprio Next.js em
`next build`/`next start` (não precisa exportar isso à mão). Isso muda
comportamento real da aplicação, sem qualquer flag adicional:

- **Pool de conexões** cai para `max: 1` (ver [Pool de conexões](#pool-de-conexões)) — pensado para runtimes serverless.
- **IA** deixa de aceitar o modo fake — `OPENROUTER_API_KEY` ausente vira erro real (ver [IA](#ia)).
- **Erros de negócio** (ex.: limite de upload excedido) são comunicados via
  `redirect()` com mensagem amigável na URL, nunca via exceção não tratada —
  evita a tela genérica "Application error" que o React usa em produção
  para qualquer erro não tratado explicitamente.

Variáveis obrigatórias em produção são as mesmas do [Quickstart](#quickstart-do-zero-em-15-minutos):
`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` — a aplicação recusa subir sem elas (ver
[Variáveis de ambiente](#variáveis-de-ambiente)). Deploy alvo: **Vercel**
(mas nada aqui depende de API exclusiva da Vercel — qualquer host Node.js
20+ que rode `next start` funciona).

## Healthcheck

```
GET /health
```

Rota pública (isenta de autenticação em `src/proxy.ts`) — sem sessão
necessária, para monitoramento/orquestração externos.

```json
{ "status": "ok" }
```

ou, em caso de falha:

```json
{ "status": "erro" }
```

HTTP `200` quando Postgres e Supabase Auth (os dois serviços dos quais a
aplicação realmente depende) respondem; `503` caso qualquer um falhe.
Resposta pública endurecida na Sprint 14 (Hardening Final) — **nunca**
inclui stacktrace, mensagem do driver, timestamp, versão ou qualquer outro
detalhe interno; isso vai só para o `logger` (`infra/logging/logger.ts`),
nunca para a resposta HTTP.

---

## Estrutura de pastas

```
src/                  → Domain, Application e Presentation, organizados por Bounded Context
  <contexto>/domain/          regras puras, sem I/O
  <contexto>/application/     casos de uso, orquestração
  <contexto>/infrastructure/  implementações concretas + raiz de composição (composicao.ts)
  app/                         Presentation — rotas Next.js (App Router), Server Actions
  shared/                      capacidades genuinamente cross-context (Clock, UuidGenerator, EventPublisher/Handler)
infra/                → Infrastructure técnica não amarrada a um Bounded Context
  persistence/db/               cliente Drizzle, migrate/seed, schema, Unit of Work
  scheduler/                    Jobs + executor manual
  integrations/                 placeholders de integrações externas (Google, IA)
  auth/                          cliente Supabase (server/browser)
migrations/           → Migrations SQL versionadas (fonte da verdade de schema)
tests/                → unit / integration / e2e
config/               → configuração de ambiente (única fonte, validada por Zod)
docs/                 → documentação normativa congelada (fonte da verdade de produto/arquitetura)
```

Ver `docs/ARCHITECTURE.md` (seções 3 e 22) para a justificativa completa
desta organização, e `docs/CODING_GUIDELINES.md` para as convenções de
código.

## Fluxo arquitetural (de uma informação)

```
Captura (Inbox) → Persistência inicial (RegistroBruto)
  → Pré-processamento (se necessário)
  → Classificação por IA (SugestaoIA)
  → Confirmação humana (aceitar/editar/rejeitar — nunca automática)
  → Efeito no domínio (Aggregate Root correspondente)
  → Persistência final
  → Notificação (se aplicável)
  → event_log (via Event Dispatcher)
```

(`docs/ARCHITECTURE.md`, seção 6.)

---

## Regras não-negociáveis

- IA nunca escreve diretamente em um Aggregate Root (ADR-005).
- Nenhuma regra de negócio vive em Infrastructure ou Presentation.
- Nenhum novo Bounded Context é criado sem seguir ADR-007 (adição, nunca
  acoplamento).
- Qualquer dúvida ou lacuna encontrada durante a implementação é tratada
  como pergunta arquitetural, nunca como liberdade de decisão do
  Software Engineer (ver `docs/ENGINEERING_MANIFEST.md`).
- **`docs/DATABASE.md` é a fonte de verdade do schema.** O schema Drizzle
  em `infra/persistence/db/schema/` é exclusivamente sua implementação
  técnica — nunca o inverso. Qualquer alteração de schema de negócio
  (nova tabela, coluna, enum, índice) deve primeiro estar refletida em
  `docs/DATABASE.md`; editar apenas o Drizzle sem isso é uma violação
  do `ENGINEERING_MANIFEST.md`.

---

## Troubleshooting

**"Variáveis de ambiente ausentes ou inválidas" ao subir a aplicação**
`config/env.ts` valida tudo via Zod no boot — a exceção lançada lista
exatamente quais variáveis faltam. Confira `.env.local` contra
`.env.example` (ver [Variáveis de ambiente](#variáveis-de-ambiente)).

**`db:migrate`, `db:seed` ou `jobs:run` não enxergam `.env.local`**
Esses scripts rodam via `tsx`, que — diferente de `next dev`/`next build` —
não carrega `.env.local` automaticamente. Os scripts em `package.json` já
usam a flag nativa `tsx --env-file=.env.local <script>`; se você rodar um
script `tsx` novo manualmente, adicione a mesma flag (ou
`node --env-file=.env.local`).

**Upload na Inbox falha com "Nenhum registro encontrado" ou erro de Storage**
O bucket (`SUPABASE_STORAGE_BUCKET_INBOX`, padrão `inbox-arquivos`) precisa
existir de verdade no painel do Supabase — nenhuma migration ou seed cria
buckets (ver [Dependências implícitas](#dependências-implícitas)).

**Tela de Conteúdo/Conhecimento aparece vazia (`<select>` sem opções)**
`npm run db:seed` ainda não rodou — Pilares, Séries Fixas, Frameworks,
Temas e Regras de Decisão (Reference Data) só existem depois do seed.

**Login redireciona de volta para `/login` mesmo com credenciais corretas**
Confirme que o usuário foi criado no Supabase Auth (painel →
Authentication → Users) — este sistema é single-user e não tem tela de
cadastro própria.

**Testes de integração falham na inicialização**
`tests/integration/**` precisa de `DATABASE_URL` real com migrations
aplicadas — sem isso, a suíte falha ao validar o ambiente (não
silenciosamente). Rode `npm run db:migrate` antes.

**`npm run test:e2e` falha ao logar**
Confirme `E2E_USER_EMAIL`/`E2E_USER_PASSWORD` em `.env.local`, apontando
para um usuário real do Supabase Auth (nunca um usuário de produção — ver
[Testes E2E](#testes-e2e)).

**`EADDRINUSE` / porta já em uso ao rodar `next dev`/`next start`**
Outro processo (uma execução anterior não encerrada) já está escutando a
porta. Encerre o processo Node.js pendente ou rode numa porta diferente
(`next dev --port 3001`).
