# Deploy Checklist

Checklist operacional para levar o SEPosicionaVictor a um ambiente de
produção real. Cada item referencia onde a informação completa vive —
este documento não substitui o [README](README.md), só organiza a ordem
de execução.

---

## 1. Servidor

- [ ] Node.js **20.9+** (mínimo exigido pelo Next.js 16).
- [ ] Host capaz de rodar `next start` (qualquer Node.js 20+ — não há
      dependência de API exclusiva da Vercel, embora seja o alvo
      documentado).
- [ ] Se serverless (Vercel ou equivalente): confirmar que o runtime
      suporta Node.js nativo (não Edge) para as Server Actions e rotas
      dinâmicas — o proxy de autenticação (`src/proxy.ts`) roda em
      runtime Node.js por padrão no Next.js 16.

## 2. Banco (Postgres via Supabase)

- [ ] `DATABASE_URL` de **produção** aponta para o pooler em modo
      transação (porta **6543**), não a conexão direta (porta 5432) — ver
      [README § Pool de conexões](README.md#pool-de-conexões). A conexão
      direta usada em desenvolvimento não escala sob múltiplas instâncias
      serverless.
- [ ] `npm run db:migrate` aplicado contra o banco de produção **antes**
      do primeiro deploy da aplicação.
- [ ] `npm run db:generate` rodado localmente antes do deploy para
      confirmar que não há diferença entre `docs/DATABASE.md`,
      `infra/persistence/db/schema/*.ts` e as migrations já commitadas
      (deve reportar "No schema changes, nothing to migrate").
- [ ] RLS habilitado em todas as tabelas — confirmar com:
      ```sql
      select count(*) from pg_tables where schemaname='public' and rowsecurity=false;
      ```
      Deve retornar `0`.

## 3. Storage

- [ ] Bucket `SUPABASE_STORAGE_BUCKET_INBOX` (padrão `inbox-arquivos`)
      **criado manualmente** no painel do Supabase de produção — nenhuma
      migration ou seed cria buckets.
- [ ] Bucket configurado como **privado** (não público) — confirmar em
      Storage → bucket → Settings.

## 4. Supabase (projeto de produção, separado do de desenvolvimento)

- [ ] Projeto Supabase de produção criado (nunca reaproveitar o projeto de
      desenvolvimento/homologação).
- [ ] Pelo menos um usuário criado em Authentication → Users (sistema é
      single-user, sem tela de cadastro própria).
- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
      `SUPABASE_SERVICE_ROLE_KEY` copiados de Project Settings → API do
      projeto de **produção**.

## 5. Variáveis de ambiente

Ver [README § Variáveis de ambiente](README.md#variáveis-de-ambiente)
para a lista completa e onde obter cada uma. Obrigatórias:

- [ ] `DATABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

Opcionais, mas com efeito real em produção se ausentes:

- [ ] `OPENROUTER_API_KEY` — sem ela, em produção a classificação da Inbox
      **lança erro** (o modo fake só existe fora de produção).
- [ ] `DATABASE_POOL_MAX` — só se o padrão automático (`max: 1` em
      produção) precisar de ajuste.
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — só se Brand
      Intelligence (sincronização com Google Drive) for usado.

A aplicação **recusa subir** se alguma obrigatória estiver ausente
(validação Zod em `config/env.ts`) — não é possível esquecer uma sem
perceber no primeiro boot.

## 6. Build

- [ ] `rm -rf .next` (build limpo, sem cache de uma versão anterior).
- [ ] `npm ci` (não `npm install` — respeita exatamente o
      `package-lock.json` commitado).
- [ ] `npm run build` — deve compilar sem warnings de configuração
      depreciada e sem erros de tipo.
- [ ] `npm start` — deve subir e responder em `/health`.

## 7. Seed

- [ ] `npm run db:seed` rodado **uma vez** contra o banco de produção,
      antes do primeiro uso real — semeia Fundamento (a partir do
      `SOM.md`), Pilares, Séries Fixas e Conhecimento (Frameworks, Temas
      Mapeados, Regras de Decisão, Perguntas Recorrentes). Sem isso,
      telas como Conteúdo ficam com `<select>` vazio.
- [ ] Confirmado idempotente — pode rodar de novo sem duplicar (cada
      função verifica existência antes de inserir), mas não há motivo
      para rodar mais de uma vez num banco de produção já semeado.

## 8. Health

- [ ] `GET /health` retorna `{"status":"ok"}` com HTTP 200 após o deploy.
- [ ] Confirmar que a resposta **nunca** inclui stacktrace, mensagem de
      driver, timestamp ou qualquer detalhe interno — só
      `{"status":"ok"}` ou `{"status":"erro"}` (ver
      [README § Healthcheck](README.md#healthcheck)).
- [ ] Configurar o monitoramento externo (uptime checker, load balancer
      health check) para bater em `/health` — é rota pública, sem sessão.

## 9. Backup

- [ ] Confirmar que o Supabase de produção tem backup automático
      habilitado, com retenção condizente com `docs/ARCHITECTURE.md`
      (seção 16, "Estratégia de Backup"): **backup diário do banco
      relacional, retenção 30–90 dias**. Este projeto não implementa
      backup próprio em código — depende do backup nativo do Supabase.
- [ ] Documentos oficiais (Brand Intelligence) não precisam de backup
      próprio — o Google Drive já é a fonte de verdade documental, e a
      base indexada localmente é recriável a partir dele (mesma seção).
- [ ] Arquivos da Inbox (bucket `inbox-arquivos`) **não estão cobertos**
      pela nota acima — confirmar separadamente se o plano Supabase
      contratado inclui backup do Storage, ou se isso fica como risco
      aceito.

## 10. Rollback

- [ ] Repositório Git com histórico completo (ver `RELEASE_NOTES.md`) —
      qualquer deploy problemático pode reverter para o commit anterior.
- [ ] **Migrations não têm rollback automático** (Drizzle não gera
      `down` migrations neste projeto) — reverter um schema aplicado
      exige uma migration nova que desfaça a mudança, nunca editar uma
      migration já aplicada. Planejar isso *antes* de aplicar uma
      migration arriscada em produção.
- [ ] Se o deploy for na Vercel: usar o mecanismo nativo de rollback
      instantâneo para o deployment anterior (não depende deste projeto).

## 11. Monitoramento

- [ ] `/health` monitorado externamente (ver item 8).
- [ ] Scheduler externo configurado para chamar os Jobs periodicamente —
      **nenhum Job roda sozinho** (`npm run jobs:run -- monitor-de-consistencia`
      e `npm run jobs:run -- atualizar-itens-vencidos`, ver
      [README § Jobs e Scheduler](README.md#jobs-e-scheduler)). Sem um
      agendador externo (Trigger.dev ou equivalente) chamando essas
      funções, Alertas e itens vencidos nunca são atualizados sozinhos.

## 12. Logs

- [ ] Logger estruturado (`infra/logging/logger.ts`) escreve JSON em
      stdout/stderr — confirmar que a plataforma de deploy captura e
      indexa isso (a maioria das plataformas serverless já faz
      automaticamente).
- [ ] Nenhum `console.log` fora do logger e dos scripts CLI
      (`db:migrate`, `db:seed`, `jobs:run`) — confirmado na homologação
      (Sprint 14/15).

---

Ver também [`RELEASE_NOTES.md`](RELEASE_NOTES.md) para o estado exato
desta release e known issues.
