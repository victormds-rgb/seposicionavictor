# Backlog v2 — Experiência de Produto

Melhorias que nasceram de operar o sistema de verdade (homologação e uso
guiado, Sprints 14–19) — não de "poderia ser legal". Cada item existe
porque um passo real do dia a dia esbarrou nele. Nada de arquitetura,
nada de refatoração — só o que muda a experiência de quem usa.

Vários itens abaixo **já estão especificados** em
`docs/INTERACTION_MODEL.md` (documento congelado) mas nunca foram
construídos — sinalizado em cada um. Isso não é uma sugestão nova, é
trabalho já aprovado que falta fazer.

---

## Must Have

Sem isso, o uso diário tem atrito real e recorrente.

1. **Mostrar o identificador do Cliente na própria tela de Clientes.**
   Hoje, criar um Projeto para "Cliente externo" exige abrir o painel do
   Supabase e procurar manualmente na tabela — todo cliente novo, toda
   vez. É o maior ponto de fricção observado em todo o fluxo de
   onboarding ([`CLIENT_ONBOARDING.md`](CLIENT_ONBOARDING.md)).
2. **Alertas se atualizarem sozinhos.** Hoje o Job que gera Alertas só
   roda quando alguém lembra de rodar manualmente. Um sistema de alerta
   que não alerta sozinho falha no propósito de existir — o usuário
   precisa ativamente ir procurar o problema em vez de ser avisado dele.
3. **Algum aviso fora da própria tela quando um Alerta novo aparece**
   (e-mail, no mínimo). Hoje a única forma de saber que algo está errado
   é abrir o Dashboard por conta própria — não há nenhum empurrão do
   sistema na direção do usuário.

## Should Have

Reduz atrito real, mas o sistema funciona sem isso hoje.

4. **Busca Global** (já especificada em `docs/INTERACTION_MODEL.md`,
   seção 5 — atalho `/` ou `Ctrl+K`). Hoje só a Inbox tem busca; achar um
   Cliente, Projeto ou Peça de Conteúdo específico exige rolar a lista
   inteira de cada tela.
5. **Página de detalhe do Cliente**, reunindo num só lugar: Lead de
   origem, Projeto(s), Conteúdo relacionado, Alertas ligados a ele. Hoje
   isso está espalhado em três telas sem nenhum link entre elas.
6. **Editar um Lead depois de criado.** Hoje só dá para qualificar
   (adicionar informação); corrigir um nome digitado errado ou uma
   origem trocada não tem caminho nenhum na interface.
7. **Ações em lote na Inbox** (aceitar/descartar vários registros de uma
   vez). Quando a fila de pendências cresce, tratar um por um é o gargalo
   do dia.

## Could Have

Melhoraria a experiência, mas o sistema já é usável sem isso.

8. **Command Palette** (`Ctrl+K`/`Cmd+K`, já especificado em
   `docs/INTERACTION_MODEL.md`, seção 3) — abrir módulo, criar registro,
   navegar, tudo pelo teclado sem sair do que se está fazendo.
9. **Focus Mode** (já especificado, seção 13) — esconder Alertas e
   pendências temporariamente durante um bloco de escrita longa (Terça/
   Quarta/Quinta da rotina semanal), sem perder nada, só sem distração.
10. **Exportar as métricas mensais** (SOM Cap. 9.7) em CSV/PDF — hoje a
    checklist mensal exige olhar e anotar manualmente, sem nenhum
    relatório pronto.
11. **Histórico/timeline por Cliente** — sequência cronológica de tudo
    que aconteceu com aquele cliente, sem precisar cruzar datas entre
    telas diferentes.
12. **Context Menu** (clique direito, já especificado, seção 8) para
    ações rápidas em itens de lista, sem precisar abrir/rolar até o
    botão certo.

## Won't Have

Fora do espírito deste produto — decisão consciente, não lacuna.

13. **Multi-usuário/permissões.** O sistema é deliberadamente single-user
    (`docs/SOFTWARE_SPEC.md`) — não existe "equipe" para gerenciar aqui.
14. **App mobile nativo.** Quick Capture funcionando em qualquer
    navegador (inclusive no celular) já cobre a necessidade real de
    "capturar de onde estiver"; um app dedicado é custo sem ganho
    proporcional para um único usuário.
15. **CRM financeiro completo** (faturamento, cobrança, contratos). Já
    listado como deliberadamente fora do escopo em
    `docs/ARCHITECTURE.md`, seção 26.
16. **Dashboard de analytics com gráficos vistosos.** O próprio SOM
    (Cap. 9.7) avisa explicitamente contra métrica de vaidade — um
    dashboard bonito de curtidas/views incentivaria exatamente o
    comportamento que o sistema foi desenhado para evitar.
