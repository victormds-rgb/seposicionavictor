# Deploy na Vercel

Guia passo a passo para publicar o SEPosicionaVictor na Vercel. Complementa
[`DEPLOY_CHECKLIST.md`](DEPLOY_CHECKLIST.md) (checklist genérico de
qualquer plataforma) e [`PRODUCTION_ENV.md`](PRODUCTION_ENV.md) (lista
completa de variáveis).

---

## 1. Criar projeto

1. Crie um **projeto Supabase de produção separado** do de desenvolvimento
   (nunca reaproveite o projeto de dev/homologação) — ver
   [`DEPLOY_CHECKLIST.md`](DEPLOY_CHECKLIST.md), seções 2–4.
2. No painel do Supabase de produção:
   - Rode `npm run db:migrate` localmente, apontando `DATABASE_URL` para
     esse banco novo, para aplicar o schema.
   - Rode `npm run db:seed` uma vez.
   - Crie o bucket de Storage (**Storage → New bucket**, nome
     `inbox-arquivos`, privado).
   - Crie pelo menos um usuário em **Authentication → Users → Add user**.
3. Em [vercel.com](https://vercel.com), **Add New → Project**.

## 2. Conectar GitHub

1. Autorize a Vercel a acessar sua conta/organização GitHub, se ainda não
   tiver feito.
2. Selecione o repositório do SEPosicionaVictor na lista.
3. A Vercel detecta automaticamente que é um projeto Next.js — não é
   necessário nenhum `vercel.json` nem configuração de build customizada
   (o projeto não usa `output: 'standalone'` nem webpack customizado, ver
   [`RELEASE_NOTES.md`](RELEASE_NOTES.md)).
4. **Framework Preset**: Next.js (detectado automaticamente).
5. **Node.js Version** (em Project Settings → General): confirme **20.x**
   ou mais recente — o `package.json` deste projeto não fixa uma versão
   via campo `engines`, então vale conferir manualmente aqui antes do
   primeiro deploy.

## 3. Configurar variáveis

Em **Project Settings → Environment Variables**, adicione todas as
variáveis obrigatórias listadas em
[`PRODUCTION_ENV.md`](PRODUCTION_ENV.md). No mínimo:

- `DATABASE_URL` (pooler, porta **6543** — não a conexão direta 5432)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Marque cada variável para o(s) ambiente(s) certo(s) (**Production**,
**Preview**, **Development** — a Vercel permite valores diferentes por
ambiente). Recomendado: usar o mesmo projeto Supabase de produção só no
ambiente **Production** da Vercel; **Preview** pode apontar para o mesmo
projeto de desenvolvimento usado localmente, para não escrever dados de
teste no banco de produção a cada Pull Request.

## 4. Primeiro deploy

1. Após configurar as variáveis, clique **Deploy**.
2. Acompanhe o log de build — deve terminar com a rota `/health` listada
   entre as rotas dinâmicas geradas (confirma que o build reconheceu a
   API Route).
3. Assim que o deploy terminar, abra a URL gerada (`*.vercel.app`) em
   `/health` — deve responder `{"status":"ok"}` com HTTP 200. Se responder
   `{"status":"erro"}` ou 503, revise as variáveis de banco/Supabase antes
   de qualquer outra coisa.
4. Faça login com o usuário criado no passo 1 e confirme que o Dashboard
   carrega — ver [`FIRST_RUN.md`](FIRST_RUN.md) para o roteiro completo de
   validação pós-deploy.

## 5. Domínio

1. **Project Settings → Domains → Add**.
2. Para um domínio próprio: aponte o DNS conforme instruído pela própria
   Vercel na tela (registro `A`/`CNAME`, dependendo se é domínio raiz ou
   subdomínio) — a Vercel emite e renova o certificado TLS automaticamente
   depois que o DNS propaga.
3. Nenhuma configuração adicional no código é necessária — a aplicação não
   depende de nenhuma URL hardcoded (confirmado na Sprint 14, item Pool de
   conexões, mesma regra vale aqui).

## 6. Rollback

- A Vercel mantém todo deployment anterior acessível e promovível
  individualmente: **Deployments → (deployment anterior) → Promote to
  Production** reverte instantaneamente, sem precisar reverter código no
  Git.
- Isso cobre regressões de aplicação, mas **não reverte migrations** já
  aplicadas no banco — ver [`DEPLOY_CHECKLIST.md`](DEPLOY_CHECKLIST.md),
  seção 10 (Rollback), sobre planejar migrations arriscadas com cuidado
  antes de aplicá-las, já que o Drizzle deste projeto não gera migrations
  de reversão automáticas.

---

## Limitação conhecida: Scheduler não roda sozinho na Vercel

Vercel é uma plataforma serverless — não existe processo Node.js
persistente rodando em segundo plano entre requisições. Os Jobs deste
projeto (`monitor-de-consistencia`, `atualizar-itens-vencidos`) hoje só
são invocáveis via linha de comando (`npm run jobs:run -- <nome>`, ver
[README § Jobs e Scheduler](README.md#jobs-e-scheduler)) — não existe uma
rota HTTP que o Vercel Cron Jobs possa chamar.

Isso significa que, **sem uma solução externa de agendamento, os Alertas e
itens vencidos nunca são atualizados sozinhos em produção**. Esta Sprint
não implementa nenhuma rota nova para resolver isso (fora de escopo —
"não implemente funcionalidades novas"). Opções que **não exigem alterar
o código da aplicação**, para avaliação futura:

- Um workflow agendado no GitHub Actions (`on: schedule`) que faz checkout
  do repositório e roda `npm run jobs:run -- <nome>` contra o
  `DATABASE_URL` de produção (via GitHub Secret) — reaproveita o script
  de CLI já existente, sem precisar de nenhuma rota HTTP nova.
- Qualquer serviço de agendamento externo (Trigger.dev ou equivalente, já
  citado no README) capaz de rodar um comando Node.js pontualmente.

Registrar essa decisão em [`ROADMAP.md`](ROADMAP.md) antes de implementar
qualquer solução — é uma decisão de infraestrutura, não uma correção
urgente para o deploy inicial.
