# Variáveis de Ambiente — Produção

Fonte de verdade no código: [`config/env.ts`](config/env.ts) (validado por
Zod — a aplicação recusa subir se alguma variável obrigatória estiver
ausente ou inválida, listando exatamente qual). Este documento existe para
quem está configurando o ambiente de produção sem precisar ler o código.

Legenda: 🔴 obrigatória · 🟡 opcional, com efeito real se ausente · ⚪
opcional, sem efeito em produção se ausente.

---

## 1. Database

| Variável | Status | Valor esperado | Onde conseguir |
|---|---|---|---|
| `DATABASE_URL` | 🔴 | String de conexão Postgres, formato `postgresql://user:senha@host:porta/postgres` — **em produção, use a porta 6543 (pooler transaction mode)**, não 5432 (conexão direta) | Painel Supabase → Project Settings → Database → Connection string → aba "Transaction" |
| `DATABASE_POOL_MAX` | ⚪ | Número inteiro positivo (ex.: `1`) | Não precisa definir — o padrão automático já é `1` em produção (`NODE_ENV=production`, setado pelo próprio `next start`). Só defina se precisar sobrescrever esse padrão. |

Por que o pooler (6543) e não a conexão direta (5432) em produção: cada
instância serverless abre seu próprio pool; com muitas instâncias
concorrentes, a conexão direta esgota o limite de conexões do Postgres
rapidamente. Ver [`README.md` § Pool de conexões](README.md#pool-de-conexões).

## 2. Supabase — Auth + Storage

| Variável | Status | Valor esperado | Onde conseguir |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 🔴 | `https://<projeto>.supabase.co` | Painel Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 🔴 | Chave pública (JWT longo) | Painel Supabase → Project Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔴 | Chave privada (JWT longo) — **nunca exposta ao client, nunca em variável `NEXT_PUBLIC_*`** | Painel Supabase → Project Settings → API → `service_role` `secret` |
| `SUPABASE_STORAGE_BUCKET_INBOX` | ⚪ | Nome do bucket (padrão `inbox-arquivos` se omitida) | Você mesmo escolhe o nome ao criar o bucket — precisa **existir de verdade** no painel (Storage → New bucket, privado), nenhuma migration cria buckets |

## 3. OpenRouter — IA (classificação da Inbox)

| Variável | Status | Valor esperado | Onde conseguir |
|---|---|---|---|
| `OPENROUTER_API_KEY` | 🟡 | Chave de API (`sk-or-...`) | [openrouter.ai/keys](https://openrouter.ai/keys) |

**Sem ela, em produção**: a classificação automática da Inbox lança erro
ao tentar rodar (o modo fake determinístico só existe fora de produção —
ver [README § IA](README.md#ia)). A aplicação **sobe normalmente** sem
essa variável; o erro só acontece se/quando alguém tentar capturar algo na
Inbox. **Não bloqueia o deploy nem o boot da aplicação.**

## 4. Google Workspace — Calendar / Drive / Gmail

| Variável | Status | Valor esperado | Onde conseguir |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | ⚪ | Client ID OAuth2 | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | ⚪ | Client secret OAuth2 | Google Cloud Console → APIs & Services → Credentials |

**Sem elas**: apenas a sincronização de Brand Intelligence (Google Drive)
fica indisponível — falha de forma não-bloqueante, sempre vira status
`erro` no documento, nunca derruba o resto do sistema. Google Calendar e
Gmail **não estão implementados** no código hoje (ver
[`ROADMAP.md`](ROADMAP.md)) — essas variáveis não têm efeito nenhum sobre
eles ainda. **Não bloqueiam o deploy.**

## 5. Playwright / E2E

| Variável | Status | Valor esperado | Onde conseguir |
|---|---|---|---|
| `E2E_USER_EMAIL` | ⚪ | E-mail de um usuário de teste dedicado | Você mesmo cria esse usuário no Supabase Auth — **nunca** um usuário de produção real |
| `E2E_USER_PASSWORD` | ⚪ | Senha do mesmo usuário | — |

Usadas **exclusivamente** por `npm run test:e2e`, rodado localmente ou em
CI — nunca lidas pela aplicação em execução. **Não devem ser configuradas
no ambiente de produção da Vercel** (não têm função lá, e um usuário E2E
não deveria existir no projeto Supabase de produção).

## 6. Runtime

| Variável | Status | Valor esperado | Onde conseguir |
|---|---|---|---|
| `NODE_ENV` | ⚪ | `production` | **Não defina manualmente** — `next build`/`next start` já setam isso sozinhos. Definir à mão pode inclusive causar comportamento inesperado em alguns hosts. |

---

## Resumo — o que realmente bloqueia o deploy

Só estas 4 impedem a aplicação de subir (validação Zod em
`config/env.ts`, falha imediata e explícita no boot):

```
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Todas as demais (`OPENROUTER_API_KEY`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`,
`DATABASE_POOL_MAX`) são genuinamente opcionais — a aplicação sobe e
funciona sem elas, com degradação isolada e não-bloqueante nas
funcionalidades específicas que dependem de cada uma. Ver Item 5 do
processo de deploy desta Sprint para a confirmação ponto a ponto.
