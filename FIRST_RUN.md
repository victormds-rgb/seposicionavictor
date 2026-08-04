# Primeiro Uso — Fluxo Completo Guiado

Roteiro para validar um deploy novo de ponta a ponta, ou para conhecer o
sistema pela primeira vez. Segue o fluxo real de negócio (Lead → Cliente →
Projeto → Conteúdo → Publicação → Alerta → Resolução), o mesmo usado para
homologar esta release. Todos os passos foram executados manualmente
contra a aplicação real antes deste documento ser escrito.

Pré-requisito: deploy funcionando, `/health` respondendo `{"status":"ok"}`,
e um usuário criado no Supabase Auth (ver [`DEPLOY_VERCEL.md`](DEPLOY_VERCEL.md)).

---

## 1. Login

Acesse a URL do deploy — você cai em `/login` automaticamente (rota
protegida sem sessão redireciona para lá). Preencha e-mail e senha do
usuário criado no Supabase Auth, clique **Entrar**. Você é levado direto
para o **Dashboard**, que mostra a Agenda do dia, Alertas ativos,
Pendências da Inbox e a Distribuição de Pilares.

## 2. Criar Lead

Menu → **Pipeline Comercial**. Na seção **Novo Lead**, preencha:

- **Nome** (obrigatório)
- **Origem** (texto livre, ex.: "indicação")
- **SDR responsável** (opcional)
- **Temperatura** (Frio / Morno / Quente)
- **Ticket estimado** (opcional)

Clique **Criar Lead**. Ele aparece na lista abaixo com status `novo`.

No mesmo Lead, preencha **Registrar qualificação** (Resumo, Objeções,
Próximo passo) — o status muda para `qualificado` e um formulário de
**Agendar** aparece.

Preencha **Data e hora** e clique **Agendar (cria reunião na Agenda)** — o
Lead muda para `agendado` e uma Reunião correspondente é criada na Agenda
automaticamente.

Vá em **Agenda**, encontre a reunião pela data/hora, clique **Marcar como
realizada**. Volte para **Pipeline Comercial** — o Lead mostra **Confirmar
que a reunião aconteceu**; clique. O status muda para `reunido`.

## 3. Converter Cliente

Assim que o Lead está `reunido`, o formulário de conversão aparece no
próprio card do Lead (árvore de decisão, SOM Cap. 7.1):

- **Nome do cliente** / **Setor**
- **Este cliente tem autoridade/competência real no próprio setor?** (Sim/Não)
- **Ele aceita ouvir diagnóstico antes de exigir execução imediata?** (Sim/Não)
- **Existe sinal de não cumprimento de combinado (histórico/indicação)?** (Sim/Não)

Clique **Converter em Cliente**. O novo Cliente aparece em **Clientes**,
com uma classificação automática (ex.: `prioridade_alta` ou
`exigir_contrato_reforcado`, conforme as respostas acima).

## 4. Criar Projeto

Menu → **Projetos** → seção **Novo Projeto**:

- **Nome**, **Tipo** (Cliente externo / Produto próprio)
- **Cliente (uuid)** — obrigatório se "Cliente externo". **A tela de
  Clientes não exibe o UUID** (limitação conhecida, ver
  [`ROADMAP.md`](ROADMAP.md)) — copie o `id` do cliente recém-criado pelo
  Table Editor do Supabase (tabela `cliente`, coluna `id`) e cole aqui.
- **Desculpa inicial** / **Custo mensal** (se cliente externo)

Clique **Criar Projeto**. Ele aparece na lista com status `iniciado`.

## 5. Criar Conteúdo

Menu → **Conteúdo** → seção **Nova Peça (autônoma)**:

- **Canal** (linkedin, instagram, x, youtube, newsletter)
- **Pilar** (um dos 5 já semeados)
- **Conteúdo** (texto livre)

Clique **Criar**. A peça aparece na lista com status `rascunho`.

## 6. Publicar

Na mesma peça, clique **Avançar etapa** três vezes seguidas:

```
rascunho → em_revisão → agendado → publicado
```

Ao chegar em `publicado`, a Distribuição de Pilares (mesma página) é
recalculada automaticamente, contabilizando essa peça.

## 7. Ver Alertas

Alertas **não aparecem em tempo real** — são gerados pelo Job
`monitor-de-consistencia`, que precisa ser acionado (ver
[README § Jobs e Scheduler](README.md#jobs-e-scheduler) e a limitação de
agendamento automático descrita em
[`DEPLOY_VERCEL.md`](DEPLOY_VERCEL.md)). Para ver um Alerta de verdade
agora, rode manualmente (com `DATABASE_URL` apontando para o banco de
produção):

```bash
npm run jobs:run -- monitor-de-consistencia
```

Depois, menu → **Alertas** — a lista mostra cada Alerta ativo com tipo
(`build_log_ausente`, `desvio_pilares` ou `auditoria_devida`) e a condição
que o disparou.

## 8. Resolver Alertas

Em cada Alerta `ativo`, dois botões podem aparecer (depende do tipo):

- **Reconhecer** — muda o status para `reconhecido` (você viu, ainda não
  resolveu de fato).
- **Resolver** — muda o status para `resolvido` (disponível para
  `desvio_pilares` e `auditoria_devida`; alertas de `build_log_ausente` só
  são resolvidos automaticamente ao publicar um novo Build Log em
  **Projetos**, nunca manualmente pela tela de Alertas — é a regra de
  negócio documentada no próprio card do Alerta).

Pronto — você percorreu o fluxo completo de ponta a ponta:
**Lead → Cliente → Projeto → Conteúdo → Publicação → Alerta → Resolução.**
