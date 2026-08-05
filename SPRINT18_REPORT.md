# Sprint 18 — Product Polish — Relatório

Data: 2026-08-04. Escopo: corrigir exclusivamente os achados **Médio** da
auditoria de release final. Nenhuma arquitetura, módulo novo, refatoração
não solicitada ou mudança de banco além do estritamente necessário.

---

## Itens não implementados — parada deliberada

Dois dos seis itens da Sprint exigiam investigação antes de qualquer
código, com instrução explícita de **parar** em caso de dúvida de
domínio. Ambos pararam:

### Item 3 — `fundamento_historico`

**Não implementado.** `src/fundamento/domain/fundamento.ts` já documenta,
antes desta Sprint, que a edição do Fundamento é "ação humana direta e
deliberada (SOM Cap. 8.3)", fora do escopo de qualquer Use Case. SOM Cap.
8.3 confirma: "Filosofia e posicionamento só voltam à mesa se uma
contradição grave aparecer" — um processo raro e excepcional, não um
fluxo de edição rotineiro. Não existe, em nenhum lugar do código, um Use
Case de edição do Fundamento para eu conectar uma gravação em
`fundamento_historico`. Implementar isso exigiria **inventar** um Use
Case de edição inteiro (campos, validação, regras de transição de
`versao`) — decisão de arquitetura fora da minha autoridade. Documentado
em `src/fundamento/README.md` (atualizado nesta Sprint) para quem for
avaliar essa decisão no futuro.

### Item 4 — "Cancelar reunião"

**Não implementado.** O estado `cancelada` e a função `podeSerCancelada`
já existem e são testados isoladamente, mas: (a) `docs/DOMAIN_MODEL.md`
cataloga exatamente 3 eventos para Reuniao — `reuniao.agendada`,
`reuniao.encerrada`, `reuniao.processada` — **`reuniao.cancelada` não
existe**, e eu precisaria inventar um nome de evento novo (proibido); (b)
uma Reuniao é "agendada via ItemDeAgenda", e não há nenhuma especificação
do que acontece com esse ItemDeAgenda ao cancelar (ItemDeAgenda nem tem
estado "cancelado" — só `agendado`, `concluido`, `perdido`). Isso é regra
de negócio faltando, não wiring.

---

## Arquivos alterados

### 1. `src/app/(shell)/configuracoes/page.tsx` (reescrito)

**Motivo:** substituir o stub "Módulo ainda não implementado" (achado
Médio #1 da auditoria) por uma Central de Configurações real.

**Conteúdo:** versão (lida de `package.json`), ambiente (`NODE_ENV` real),
status do banco (consulta `select 1` real, com latência), Jobs
registrados do Scheduler (lista real de `infra/scheduler/jobs`, com nota
honesta de que não há processo persistente e a página não sabe a última
execução), status do provedor de IA (`OPENROUTER_API_KEY` configurada ou
não — nunca o valor), e uma lista de referências à documentação. Nenhuma
configuração editável foi criada — só leitura.

**Impacto:** página deixa de mostrar um "não implementado" no menu
principal para qualquer usuário logado; passa a mostrar diagnóstico real
do sistema.

**Risco:** baixo. Rota já autenticada (dentro do Shell); consulta ao
banco usa o mesmo padrão seguro do `/health` (nunca expõe detalhe de erro
fora de uma seção já autenticada e de uso exclusivo do próprio usuário).

### 2. `src/event_log/README.md`, `src/fundamento/README.md`, `src/shared/README.md` (reescritos)

**Motivo:** os três diziam "ainda não implementado nesta fase (Bounded
Context reservado)" — desatualizado; os três têm implementação real e
ativa (achado Médio #12 da auditoria).

**Conteúdo:** cada README agora lista o que realmente existe em código
(arquivo por arquivo), com que propósito, e onde é usado. O README de
`fundamento` documenta explicitamente por que `fundamento_historico`
nunca é escrita (ligado ao Item 3 acima). O README de `shared` corrige
uma menção a `FormatoDeCase`/`FormatoDeBuildLog` (Value Objects que nunca
existiram no código — confirmado por busca exaustiva antes da edição).

**Impacto:** nenhum — documentação apenas, não congelada
(`docs/` continua intocado).

**Risco:** nenhum.

### 3. `infra/auth/supabase-browser.ts` (removido)

**Motivo:** `createSupabaseBrowserClient` — reconfirmado nesta Sprint via
busca exaustiva (`grep -rn` em `src/`, `infra/`, `tests/`) que não tem
nenhum uso em lugar nenhum do projeto. O arquivo continha só essa função;
removido o arquivo inteiro.

**Impacto:** nenhum — código morto, zero referências.

**Risco:** nenhum. `npm run typecheck` confirma zero erro após a remoção.

### 4. `tests/integration/brand_intelligence/fluxo-completo.test.ts`, `tests/integration/notificacoes/fluxo-completo.test.ts`

**Motivo:** 2 variáveis locais não utilizadas, identificadas na auditoria
via `tsc --noUnusedLocals --noUnusedParameters` (sem alterar
`tsconfig.json`).

- `portaDeDrive` (brand_intelligence, linha 17) — removida a declaração;
  não era usada nesse teste específico (outros 4 testes do mesmo arquivo
  usam a variável normalmente e não foram tocados).
- `projeto` (notificacoes, linha 188) — trocado `const projeto = await
  criarProjeto(...)` por `await criarProjeto(...)`, preservando o efeito
  colateral (criar o Projeto real que o teste precisa) sem declarar um
  nome nunca lido.

**Impacto:** nenhum no comportamento dos testes — comportamento idêntico,
confirmado pela suíte completa passando como antes.

**Risco:** nenhum.

### 5. 37 arquivos `.gitkeep` removidos

**Motivo:** redundantes — cada um estava em uma pasta que já tinha
arquivos reais rastreados ao lado (confirmado individualmente antes da
remoção: só removi `.gitkeep` de pastas com pelo menos 1 outro arquivo
real). Os **11 `.gitkeep` que ainda marcam pastas genuinamente vazias**
(`infra/integrations/*`, `src/tarefas/*`, `src/shared/ports`,
`src/shared/value_objects`, `src/event_log/application`,
`src/fundamento/application`, `src/ia/application`) foram **mantidos**.

**Impacto:** nenhum — arquivos sem função no Git além de manter pasta
vazia rastreada; as pastas afetadas não estavam vazias.

**Risco:** nenhum.

### 6. `README.md` — não alterado

Nenhuma seção do README principal referenciava `/configuracoes` ou
`supabase-browser.ts`; nada ficou desatualizado por essas mudanças.
Confirmado antes de decidir não tocar (`grep` sem resultado).

---

## Testes executados

| Comando | Resultado |
|---|---|
| `npm run typecheck` | ✅ limpo |
| `npm run lint` | ✅ limpo |
| `npm test` (139 testes) | 138/139 — 1 falha por timeout de rede (`MonitorDeConsistencia: gera alerta de build_log_ausente...`), mesma classe de flakiness pré-existente já documentada nas Sprints 15–17 (latência real de rede + volume de dados acumulado no banco de homologação ao longo de toda a sessão); reconfirmada em segunda execução isolada, não é regressão desta Sprint (nenhum dos dois arquivos de teste tocados nesta Sprint falhou) |
| `npx playwright test --workers=1` (12 testes) | ✅ 12/12 |
| `npm run build` | ✅ limpo, `/configuracoes` agora aparece como rota dinâmica (`ƒ`), antes estática (`○`) — esperado, a página passou a fazer consulta real ao banco |
| `npm start` + validação manual | ✅ `/health` → `{"status":"ok"}`; login → Dashboard; **12 páginas** (Dashboard, Inbox, Agenda, Pipeline, Clientes, Projetos, Conteúdo, Conhecimento, Brand Intelligence, Alertas, **Configurações**) confirmadas sem erro JS, via navegação real por Playwright contra o build de produção |

Conteúdo real confirmado em `/configuracoes` sob produção: versão
`0.1.0`, ambiente `production`, banco `Conectado` (53ms), 2 Jobs
registrados, IA `Não` configurada (reflete o `.env.local` real deste
ambiente) com aviso correto de que a classificação falhará em produção
sem a chave.

---

## Riscos remanescentes

Nenhum introduzido por esta Sprint. Os dois itens não implementados
(fundamento_historico, cancelar reunião) permanecem exatamente como
estavam — nenhuma regressão, nenhuma promessa quebrada, já que nunca
foram anunciados como funcionais.
