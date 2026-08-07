# Dogfooding Report — Sprint 23

> **Sprint 23A (correções):** #1, #3 e #4 abaixo foram implementados e
> validados em produção — ver "Status" ao final de cada um.
>
> **Sprint 23B (correções):** #2, #5 e #6 também foram implementados e
> validados em produção. O item #6 teve sua causa raiz **corrigida**
> nesta sprint — a hipótese original (Brand Intelligence não
> sincronizado) estava errada, ver "Status" abaixo.
>
> #7 e #8 permanecem apenas como observação, sem autorização para
> implementar.

Usei o sistema em produção (https://seposicionavictor.vercel.app) como se
fosse eu assumindo a operação da Albatroz Digital num dia normal,
passando pelos 10 passos pedidos nesta ordem, sem ler código antes de
sentir a fricção na interface. Só abri código depois de esbarrar em
algo real. Nenhuma correção foi feita — este relatório é só
observação, como pedido.

---

## 1. Fluxo percorrido

1. **Dashboard** — lido, sem interação de escrita.
2. **Inbox** — capturei um item de texto; tentei revisar/classificar sugestões.
3. **Pipeline Comercial** — criei 2 Leads, qualifiquei um, agendei reunião, confirmei reunião, converti em Cliente pela árvore de decisão.
4. **Clientes** — localizei o Cliente convertido, copiei o ID.
5. **Projetos** — criei um Projeto vinculado ao Cliente, preenchi os 6 campos de case, gerei e publiquei um Case.
6. **Conteúdo** — criei uma Peça autônoma, avancei rascunho → em_revisão → agendado → publicado, conferi a Distribuição de Pilares.
7. **Agenda** — instanciei a rotina semanal fixa, marquei um item como concluído.
8. **Alertas** — rodei a Auditoria de Drift (SOM Cap. 8.2).
9. **Brand Intelligence** — registrei um documento oficial, tentei sincronizar.
10. **Configurações** — revisei o painel informativo.

## 2. Tempo gasto em cada etapa (estimado pelo nº de passos/cliques necessários)

| Etapa | Tempo estimado | Observação |
|---|---|---|
| Dashboard | ~15s | Leitura única, sem ação |
| Inbox | ~2 min | Captura simples, mas beco sem saída na revisão (ver fricção #1) |
| Pipeline | ~10 min | 2 Leads, qualificação, agendamento, conversão — múltiplas idas e voltas |
| Clientes | ~10s | Leitura única |
| Projetos | ~5 min | Criação + 6 campos de case + gerar/publicar Case |
| Conteúdo | ~4 min | Criar + 3 avanços de status + publicar |
| Agenda | ~2 min | Instanciar rotina + concluir 1 item |
| Alertas | ~1 min | Rodar auditoria, ler resultado |
| Brand Intelligence | ~2 min | Registrar documento + tentar sincronizar |
| Configurações | ~30s | Leitura |
| **Total** | **~27 min** | Para 1 ciclo completo Lead→Cliente→Projeto→Case→Conteúdo→Alerta |

Nota honesta sobre esta medição: no meio da sessão, minha ferramenta de
automação de navegador degradou temporariamente (cliques parando de
disparar requisição alguma, em qualquer página, inclusive uma que já
tinha funcionado antes) — precisei abrir uma aba nova para recuperar.
Isso é uma limitação do meu ambiente de teste desta sessão, não do
produto; sinalizo porque adicionou tempo real gasto que não é do
usuário. Reflito isso separadamente na fricção #7, com a confiança
correspondente rebaixada.

---

## 3–6. Fricções encontradas, impacto, frequência e solução mínima

### 🔴 CRÍTICO

**#1 — Sem IA configurada, todo item capturado na Inbox fica travado; a única ação possível é "Descartar".**
- **Onde:** Inbox, qualquer item com status `capturado` sem sugestão pendente.
- **Por que atrapalha o uso diário:** a Inbox é o ponto de entrada universal do sistema (tem até atalho de teclado global, `Q`). Sem `OPENROUTER_API_KEY` (que é o estado atual de produção), não existe NENHUM caminho manual para dizer "eu sei o que isso é, vira Tarefa/Projeto/Conteúdo" — o único destino possível para qualquer captura é apagá-la. Isso significa que hoje, na prática, a Inbox só serve para anotar e depois lembrar de fazer a coisa em outro lugar de cabeça — o oposto do que ela promete.
- **Frequência estimada:** toda vez que algo é capturado (potencialmente várias vezes ao dia).
- **Solução mínima recomendada:** adicionar, só para o caso de `capturado` sem sugestão pendente, o mesmo formulário "Corrigir para" que já existe no fluxo de sugestão rejeitada — reaproveitando o componente e o Use Case `responderSugestao` já existentes (decisão "editar" já suporta escolher o tipo de destino manualmente). Não é funcionalidade nova: é destravar um caminho que o próprio Use Case já contempla, só não está exposto quando não há sugestão.
- **Tempo estimado de correção:** ~1h (ajuste de condição na Presentation, sem tocar Application/Domain).

**Status: ✅ Implementado (Sprint 23A).** Correção real: `responderSugestao`
exige uma `SugestaoIA` (não existe quando não há IA), então em vez de
reaproveitar aquele Use Case, criei `classificarManualmente`
(`src/inbox/application/classificar-manualmente.ts`) — mesmo efeito
(`criarDestino` + status `classificado`), sem depender de sugestão.
O domínio já previa isso: `podeSerConfirmado` já aceitava `capturado`
antes desta mudança. Presentation: um formulário "Classificar
manualmente (sem IA) para" aparece em `inbox/page.tsx` sempre que não
há `sugestaoPendente`. Teste novo:
`tests/unit/inbox/classificar-manualmente.test.ts` (3 casos).

### 🟠 ALTO

**#2 — Projetos nunca mostra a qual Cliente pertence.**
- **Onde:** listagem de Projetos.
- **Por que atrapalha:** o `clienteId` é salvo mas nunca exibido — a única forma de saber a quem um projeto pertence é ter escrito o nome do cliente manualmente no campo "Nome" do projeto (que não é garantido) ou consultar o banco.
- **Frequência estimada:** toda vez que a tela de Projetos é aberta com mais de um projeto ativo.
- **Solução mínima recomendada:** exibir `cliente.nome` ao lado do projeto quando `tipo = cliente_externo`, buscando pelo `clienteId` já salvo (um único `buscarPorId`, sem novo campo, sem nova tela).
- **Tempo estimado:** ~30 min.

**Status: ✅ Implementado (Sprint 23B).** `criarDependenciasDeProjetos()`
passou a incluir `clienteRepository` (já existia em Clientes, só não
era injetado em Projetos). Em `projetos/page.tsx`, para projetos
`cliente_externo`, busca `cliente.nome` via `buscarPorId(clienteId)` e
exibe ao lado do nome do projeto. Sem UUID na tela, sem campo novo,
sem Use Case novo.

**#3 — Auditoria de Drift detecta problema grave (100% de falha) mas isso não vira um Alerta rastreável nem aparece no Dashboard.**
- **Onde:** Alertas → Auditoria de Drift.
- **Por que atrapalha:** a mensagem "recomenda-se pausar produção nova e revisar o Fundamento" é um sinal operacional sério — mas fica só na tela de Alertas, dentro do histórico da auditoria, e some do radar do usuário assim que ele sai da página. `Alertas (0)` continua mostrando zero no Dashboard mesmo depois desse resultado. A automação existe (a auditoria roda e detecta), mas o sinal se perde antes de chegar em quem precisa agir.
- **Frequência estimada:** toda vez que a auditoria roda e encontra desvio — que é justamente quando mais importa ser visto.
- **Solução mínima recomendada:** quando `falha >= algum limiar` (ex.: 100%, ou o mesmo critério que já gera a recomendação textual), criar um registro de `Alerta` de verdade, reaproveitando a mesma tabela/fluxo dos alertas de vencimento já existentes — sem inventar um novo tipo de alerta, só disparando o que já existe a partir de um evento que hoje só produz texto solto.
- **Tempo estimado:** ~1–1.5h.

**Status: ✅ Implementado (Sprint 23A).** `executarAuditoriaDeDrift`
agora chama `garantirAlertaAtivo` (a mesma função idempotente já usada
pelo MonitorDeConsistencia, só exportada) quando `ultrapassouLimiar`
é verdadeiro — criando um Alerta real (`condicaoGatilho` = a própria
recomendação). Foi necessário um novo tipo, `"drift_critico"`, em
`TIPOS_ALERTA` (`notificacoes/domain/alerta.ts`): nenhum dos 3 tipos
existentes descreve "auditoria rodou e falhou". O Dashboard já lista
Alertas ativos — nenhuma mudança de Presentation foi necessária além
de garantir que a criação acontece. Teste novo (assert dentro do
teste de integração já existente que cobre esse cenário):
`tests/integration/notificacoes/fluxo-completo.test.ts`.

**#4 — Dashboard não diz o que é a tarefa do dia, só o tipo genérico.**
- **Onde:** Dashboard, seção "Agenda do dia".
- **Por que atrapalha:** `00:00 · rotina_fixa · agendado` não diz QUAL rotina é. Isso é a primeira coisa que a tela mostra para "entender prioridades" (etapa 1 desta sprint) e não dá nenhuma informação acionável — preciso ir em Agenda para saber o que realmente fazer.
- **Frequência estimada:** todo dia, primeira tela aberta.
- **Solução mínima recomendada:** trocar o rótulo genérico `rotina_fixa` pelo nome legível da série (ex.: "Build Log Radar AI"), que já existe como dado (o mesmo mapeamento usado em Agenda). Não é campo novo, é reaproveitar a mesma tradução que a página de Agenda já faz.
- **Tempo estimado:** ~20 min.

**Status: ✅ Implementado (Sprint 23A).** Correção de fato:
`ROTINA_SEMANAL_FIXA` (`agenda/domain/item-agenda.ts`) já tinha um
campo `descricao` por atividade (ex.: "Gravar/escrever Build Log do
produto") — mas nem Dashboard nem Agenda o exibiam, os dois só
mostravam o código bruto (`item.tipo`/`rotinaFixaReferencia`). A
correção foi só no Dashboard, como pedido (não toquei em Agenda):
função `descreverItemDeAgenda` em `dashboard/page.tsx` faz o lookup
em `ROTINA_SEMANAL_FIXA` e cai de volta no tipo bruto para itens que
não são `rotina_fixa`.

### 🟡 MÉDIO

**#5 — Dashboard não dá nenhuma visão de Pipeline/Clientes/Projetos.**
- **Por que atrapalha:** a primeira tela do dia mostra Agenda, Alertas, Inbox e desvio de pilares — mas nada sobre quantos Leads estão parados, quantos Projetos estão em andamento. Para saber isso, é preciso abrir 3 telas separadas.
- **Frequência estimada:** todo dia.
- **Solução mínima recomendada:** uma linha de contagem simples (ex.: "3 Leads em aberto · 2 Projetos ativos"), sem gráfico, sem nova tela — só mais uma consulta simples já usada em outras páginas, reaproveitada aqui.
- **Tempo estimado:** ~40 min.

**Status: ✅ Implementado (Sprint 23B, como "Dashboard Executivo").**
Nova seção "Visão Geral" no topo do Dashboard: Leads ativos, Clientes,
Projetos ativos, Conteúdos em produção, Conteúdos publicados, Alertas
ativos. Reaproveita 100% dos Use Cases já existentes (`listarLeads`,
`listarClientes`, `listarProjetos`, `listarPecasDeConteudo`,
`listarAlertas`) — zero Use Case novo, zero gráfico, só contagem
filtrada em memória.

**#6 — Mensagem de falha da Auditoria de Drift não diz a causa raiz.**
- **Por que atrapalha:** o texto "100% falharam no checklist" não diz por que uma peça específica falhou.
- **Frequência estimada:** toda vez que a auditoria encontra falhas.
- **Solução mínima recomendada original:** hipótese registrada aqui era de que a causa fosse Brand Intelligence sem sincronizar.
- **⚠️ Causa raiz corrigida na Sprint 23B — a hipótese acima estava errada.** Reli `falhouChecklistAutomatizavel` linha a linha: o checklist automatizável **nunca consulta Brand Intelligence**. Ele só verifica (a) repetição literal da frase-âncora, ou (b) peça autônoma sem `temaId`/`frameworkId`. A causa real da minha peça de teste falhar foi (b) — e ela **sempre vai falhar por isso**, porque o formulário "Nova Peça (autônoma)" nem tem campo de Tema/Framework. Nada a ver com sincronização.
- **Tempo estimado:** ~20 min.

**Status: ✅ Implementado (Sprint 23B), com correção de causa raiz.**
Extraídas `repetiuFraseAncora` e `semLenteReconhecivel` de dentro de
`falhouChecklistAutomatizavel` (mesmo comportamento, só nomeadas) para
permitir que o Use Case identifique qual critério reprovou cada peça.
`executarAuditoriaDeDrift` agora acrescenta ao texto da recomendação
um diagnóstico honesto: quantas peças falharam por falta de
tema/framework vs. por repetir a frase-âncora, e afirma explicitamente
que nenhuma falha é relacionada a Brand Intelligence — porque nunca é.
Lógica/limiar da auditoria **não foram alterados**.

**#7 — Submissão de formulários (Pipeline) apresentou comportamento não confiável em parte do teste.**
- **Onde:** criação de Lead em Pipeline.
- **Observação (confiança reduzida — ver nota da seção 2):** 2 de 3 tentativas de criar um Lead novo não refletiram na tela nem na lista imediatamente; a rede mostrou uma requisição retornando 200 porém marcada como abortada pelo navegador, e o dado só apareceu depois de recarregar a página — com apenas o campo obrigatório salvo, os opcionais preenchidos na tentativa "perdida" não vieram junto. Não consigo garantir que isso é bug do produto e não da minha sessão de teste (que degradou de forma comprovada depois nesta mesma sessão). **Não estou classificando isso com confiança de app bug — recomendo confirmação com um teste humano real antes de qualquer correção.**
- **Frequência estimada:** desconhecida até confirmação.
- **Solução mínima recomendada:** nenhuma ainda — apenas confirmar se reproduz fora do meu ambiente de automação.

### 🟢 BAIXO

**#8 — Texto da Pipeline sugere uma dependência que o sistema não exige de fato.**
- Reconfirmado da Sprint 22: "marque como realizada na Agenda e depois confirme aqui" — mas o botão "Confirmar que a reunião aconteceu" funciona direto, sem isso. Ajuste de uma linha de texto, ou remoção da frase.
- **Tempo estimado:** 5 min.

---

## 7. Ordem ideal de implementação

Pela regra da sprint (corrigir primeiro o que reduz mais trabalho humano, sem inventar funcionalidade):

1. **#1 — Inbox travada sem IA** (Crítico, maior volume de trabalho perdido/repetido, menor esforço de correção)
2. **#3 — Alerta de drift não rastreável** (Alto, automação já existe, só falta conectar o fio)
3. **#4 — Dashboard sem nome da rotina do dia** (Alto, baixíssimo esforço, usado todo dia)
4. **#2 — Projetos sem link ao Cliente** (Alto, baixo esforço)
5. **#6 — Mensagem de causa raiz da auditoria** (Médio, baixo esforço)
6. **#5 — Visão de negócio no Dashboard** (Médio)
7. **#8 — Texto da Pipeline** (Baixo, trivial)
8. **#7 — Confirmar antes de agir** (não entra na fila de implementação até ser confirmado como real)

---

## Impacto operacional (resumo)

Os itens #1, #3 e #4 são os que mais pesam no uso diário real: #1
porque quebra a promessa central da Inbox toda vez que é usada sem
IA configurada; #3 porque um sinal de alerta genuíno está sendo
gerado e se perdendo, exatamente o tipo de "oportunidade de
automação" que a sprint pediu para caçar; #4 porque é a primeira
coisa vista todo santo dia e não ajuda em nada a decidir o que fazer.
Juntos, #1+#3+#4 somam menos de 2h de trabalho estimado e endereçam
os 3 pontos de maior fricção repetida encontrados nesta sessão.

Nenhum código foi alterado nesta Sprint. Aguardando sua autorização
para implementar, na ordem acima ou na que você preferir.
