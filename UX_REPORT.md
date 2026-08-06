# UX Report — Sprint 22 (Produção Real)

Auditoria de produção + simulação de uso real do sistema em
https://seposicionavictor.vercel.app, cobrindo o fluxo completo Lead →
Cliente → Projeto → Case → Conteúdo → Alertas → Inbox → Agenda → Brand
Intelligence. Escopo estrito: nenhuma funcionalidade nova, nenhuma
refatoração estética, nenhuma mudança de arquitetura — apenas
problemas reais, com correção mínima quando seguro corrigir e
documentação honesta quando não.

---

## Resumo

| | |
|---|---|
| Problemas encontrados | 8 |
| Corrigidos nesta Sprint | 2 (ambos Crítico/Alto) |
| Documentados, não corrigidos (fora de escopo ou dúvida de domínio) | 6 |
| Testes novos | 2 (regressão do fix de maior severidade) |
| Suíte completa | 97/97 unit passando · typecheck e lint limpos |

---

## 1. Problemas encontrados e corrigidos

### 1.1 — Captura de texto na Inbox derrubava a página inteira (Crítico)

**Sintoma observado:** ao capturar qualquer entrada de texto na Inbox
(inclusive via o atalho global `Q`), a tela inteira quebrava com
`Minified React error #441` e HTTP 500, mostrando só uma mensagem
genérica e um botão "Tentar novamente" — sem nenhuma pista do que
aconteceu.

**Causa raiz (confirmada via logs de runtime da Vercel):** a captura
em si (persistência do `RegistroBruto`) sempre funcionava — o dado
ficava salvo no banco. O crash acontecia *depois*, numa segunda etapa
automática: classificação via OpenRouter, que lança
`OPENROUTER_API_KEY não configurada` porque essa variável não está
configurada em produção (comportamento documentado em
`config/env.ts`). Essa exceção não era tratada e derrubava a página
inteira mesmo com o dado já salvo com sucesso.

**Por que é real e não dúvida de domínio:** o próprio código já modela
`capturado` como o status inicial válido, anterior à classificação —
não é um estado novo sendo inventado, é o estado que já existia sendo
mal aproveitado pelo tratamento de erro.

**Correção aplicada:** [`src/inbox/application/capturar-registro-bruto.ts`](src/inbox/application/capturar-registro-bruto.ts) — a chamada de
classificação agora é best-effort: se falhar, loga um aviso e o
registro permanece em `capturado` (classificável manualmente depois),
em vez de propagar o erro e derrubar a captura que já tinha sucesso.

**Teste de regressão:** [`tests/unit/inbox/capturar-registro-bruto.test.ts`](tests/unit/inbox/capturar-registro-bruto.test.ts) — cobre os dois
caminhos (IA falhando → `capturado`; IA funcionando → comportamento
inalterado).

**Prioridade:** Crítico (bloqueava a funcionalidade mais usada do
sistema, com um atalho de teclado global, em toda instalação sem
`OPENROUTER_API_KEY`). **Tempo gasto:** ~30 min (investigação + fix +
teste).

---

### 1.2 — Sem o ID do Cliente em lugar nenhum, impossível criar Projeto (Alto)

**Sintoma observado:** o formulário "Novo Projeto" exige um campo
"Cliente (uuid)" digitado à mão. A tela de Clientes nunca mostrava
esse UUID — só nome, setor, status e classificação. Resultado: depois
de converter um Lead em Cliente, não havia como avançar para criar um
Projeto sem consultar o banco diretamente.

**Por que é real:** reproduzido ao vivo durante a simulação — cheguei
literalmente sem conseguir prosseguir do fluxo Cliente → Projeto sem
acesso direto ao Postgres.

**Correção aplicada:** [`src/app/(shell)/clientes/page.tsx`](src/app/(shell)/clientes/page.tsx) — expõe o
`cliente.id` (já buscado, só não estava sendo renderizado) na listagem.
Não é campo novo nem dado novo, é a exibição de um dado que já existia
na resposta da query.

**Prioridade:** Alto (bloqueava o segundo passo do fluxo central do
produto). **Tempo gasto:** ~10 min.

---

## 2. Incidente durante a validação (transparência)

Ao validar o fix 1.1, rodei `vitest run tests/integration/inbox`
apontando por engano para as credenciais do banco de **produção**
(deveria ter usado um banco descartável). Isso criou 5 registros de
fixture em `registro_bruto` — visíveis, por exemplo, como "3
registro(s) aguardando revisão" no Dashboard. As 5 `sugestao_ia`
associadas eu removi. A remoção dos 5 `registro_bruto` de teste foi
bloqueada pela política de segurança (exclusão permanente de dados de
produção não é uma ação que devo executar, mesmo autorizado) — o SQL
exato e a instrução para você rodar via Supabase SQL Editor foram
entregues em separado, no chat. Nenhum dado real (Lead, Cliente,
Projeto, Case criados manualmente durante a simulação) foi afetado.

**Recomendação de processo (não implementada, é uma sugestão para o
backlog):** ter um banco Supabase separado para rodar testes de
integração, hoje `tests/integration/*` aponta para `DATABASE_URL` do
`.env.local`, que hoje é o mesmo banco de produção.

---

## 3. Problemas encontrados e **não** corrigidos (documentados)

### 3.1 — Sem caminho na UI para criar Peça de Conteúdo a partir de um Case publicado (Alto)

Publicar um Case em Projetos não gera nenhuma Peça de Conteúdo
visível em `/conteudo`. A camada de aplicação já suporta isso
integralmente (`criarPecaDeConteudo` aceita `origemTipo: "case"` +
`origemCaseId`), mas a página de Conteúdo só expõe o formulário "Nova
Peça (autônoma)" — não existe nenhum formulário/seletor para criar uma
Peça referenciando um Case. Hoje, o único jeito de "produzir conteúdo
a partir de case" é reescrever manualmente o conteúdo numa Peça
autônoma, perdendo o vínculo.

**Por que não corrigi:** construir essa seção de UI (seletor de Case
publicado + formulário) é área de superfície nova o suficiente para
contar como funcionalidade, o que a Sprint proíbe explicitamente.
Fica como achado para autorização explícita numa sprint futura.

**Prioridade:** Alto. **Estimativa:** 2–3h (formulário + query de
cases publicados sem peça vinculada ainda).

### 3.2 — Origem do Cliente mostra UUID cru do Lead, não o nome (Baixo)

Em Clientes: `Origem: Lead 8c9a8b7e-3a73-...` — sem significado para
quem lê. Corrigir exige buscar o nome do Lead (contexto Pipeline)
dentro da página de Clientes (contexto diferente) — decisão de
fronteira entre Bounded Contexts que prefiro não tomar sozinho.

**Prioridade:** Baixa. **Estimativa:** 15 min, uma vez autorizado o
cruzamento entre contextos.

### 3.3 — Texto da Pipeline sugere um passo que não é realmente exigido (Baixo)

Depois de agendar uma reunião, a Pipeline mostra: "Reunião agendada —
marque como realizada na Agenda e depois confirme aqui." Testado ao
vivo: o botão "Confirmar que a reunião aconteceu" funciona
imediatamente, sem exigir nada na Agenda primeiro. O texto sugere uma
dependência que o sistema não impõe — pode levar o usuário a fazer um
passo extra desnecessário.

**Prioridade:** Baixa. **Estimativa:** 5 min — mas é mudança de texto
de produto, prefiro confirmar antes: o comportamento atual (sem
dependência real) ou o texto (com dependência) é que reflete a
intenção correta?

### 3.4 — Query N+1-ish na Inbox (Baixo, hoje sem impacto real)

`src/app/(shell)/inbox/page.tsx`: para cada registro com status
`classificacao_sugerida`, dispara 1–2 queries adicionais dentro de um
`Promise.all`. Paralelizado (não é sequencial), então o impacto real
hoje é mínimo — mas cresce linear com o volume de itens pendentes de
revisão. Sem sinal de lentidão real na simulação (poucos registros).
Não mexi porque não há problema mensurável agora e mexer seria
otimização especulativa.

**Prioridade:** Baixa (monitorar; revisitar se a Inbox crescer para
dezenas de itens pendentes simultâneos). **Estimativa:** 30 min se e
quando virar problema real.

### 3.5 — `SUPABASE_STORAGE_BUCKET_INBOX` e IA seguem sem configurar em produção (já conhecido)

Reconfirmado durante a simulação: `OPENROUTER_API_KEY` ausente (causa
raiz do item 1.1 — mitigado, não resolvido: a Inbox não classifica
automaticamente até a chave ser configurada). Já estava documentado
em `GAP_REPORT.md`/Configurações; sem mudança de status aqui.

### 3.6 — `.env.local` (dev) e produção apontam para projetos Supabase diferentes (já conhecido, reconfirmado)

Mesmo ponto já reportado ao final da Sprint 21 — sem mudança nesta
Sprint.

---

## 4. Áreas verificadas sem problema real encontrado

Para que fique registrado o que *foi* checado e não gerou achado —
evita re-trabalho em sprints futuras:

- **Loading states**: `SubmitButton` (via `useFormStatus`) presente em
  todos os formulários de escrita revisados — desabilita durante o
  envio, evita duplo submit.
- **Empty states**: todas as 12 páginas do Shell têm mensagem
  específica (não apenas lista vazia) quando não há dados.
- **`revalidatePath`**: 59 chamadas revisadas por arquivo — nenhuma
  duplicada dentro da mesma function; padrão consistente
  (`revalidatePath` da própria página + páginas dependentes, ex.:
  `/dashboard`, `/agenda`).
- **Memory leaks**: único `useEffect` do client-side
  (`quick-capture.tsx`, listener de teclado) tem `cleanup` correto.
- **Componentes grandes**: maior arquivo do App Router tem 246 linhas
  (`inbox/page.tsx`) — dentro do razoável para Server Components que
  combinam formulário + lista, sem necessidade de quebra.
- **Acessibilidade de formulário**: labels revisados no código-fonte
  (não confiei só na leitura de accessibility tree, que tem limitações
  de exibição) — todos os campos usam `<label>` envolvendo o `<input>`
  corretamente.
- **Console do navegador**: zero erros JS em qualquer uma das 13
  páginas após os dois fixes, testado em aba limpa.
- **Logs de runtime da Vercel**: zero erros fora do já diagnosticado
  no item 1.1 (pré-fix).

---

## 5. Verificação pós-fix

- `npm run typecheck` — limpo.
- `npm run lint` — limpo.
- `npx vitest run tests/unit` — 97/97 passando (inclui os 2 testes
  novos da regressão 1.1).
- Build de produção limpo (`next build`, sem cache).
- Redeploy em produção: build `SUCCESS`, ambos os fixes confirmados
  ao vivo em `https://seposicionavictor.vercel.app` (nova captura de
  Inbox não derruba mais a página; ID do Cliente visível e usado com
  sucesso para criar um Projeto).
- Console do navegador limpo (aba nova, sem erros residuais) após os
  fixes.
