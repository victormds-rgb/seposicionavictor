# Onboarding de Cliente Novo

Passo a passo de produto para levar um Lead novo até um Cliente com
Projeto e Conteúdo andando. Para o roteiro técnico de clique-a-clique já
existe [`FIRST_RUN.md`](FIRST_RUN.md) — este documento é o "porquê" e o
"o que observar" por trás de cada passo, do ponto de vista de quem
realmente vai operar isso todo dia.

---

## 1. Cadastrar o cliente

**Não existe cadastro direto de Cliente.** O único caminho é
**Pipeline Comercial → Lead → Qualificação → Reunião → Conversão**. Isso
não é uma limitação acidental — é a regra de negócio (SOM Cap. 7.1): um
Cliente só existe depois de passar pela árvore de decisão de aceite, e
essa árvore só pode ser respondida depois de uma reunião real ter
acontecido.

Passos:
1. **Pipeline Comercial → Novo Lead.** Preencha nome, origem, SDR
   responsável e temperatura. Não pule "Origem" — é o único campo que
   mostra depois de onde veio cada Cliente (para saber qual canal
   comercial realmente traz gente).
2. **Registrar qualificação** no mesmo Lead — resumo, objeções, próximo
   passo. É texto livre; escreva como se fosse explicar para alguém que
   nunca viu a conversa.
3. **Agendar** — cria a reunião automaticamente na Agenda. Depois de
   realizada de verdade, vá na Agenda e **marque como realizada**, volte
   ao Pipeline e **confirme que a reunião aconteceu**.
4. **Converter em Cliente** — aqui é onde a árvore de decisão entra: três
   perguntas de sim/não (autoridade real, aceita diagnóstico, sinal de
   não cumprimento). Responda com honestidade, não com esperança — a
   classificação resultante (`prioridade_alta` ou
   `exigir_contrato_reforcado`) é o que orienta como tratar esse cliente
   daqui para frente.

**O que observar:** a tela de Clientes não mostra o UUID do cliente em
lugar nenhum — você vai precisar dele no próximo passo. Anote o nome
exato que você digitou aqui, é a única forma prática de encontrá-lo
depois (ver "Como acompanhar" no fim deste documento).

## 2. Criar o projeto

**Projetos → Novo Projeto.**

- **Tipo "Cliente externo"** exige o UUID do cliente. Se você não anotou,
  pegue no painel do Supabase (Table Editor → tabela `cliente` → procure
  pelo nome) — é o único jeito hoje.
- **Desculpa inicial**: o que o cliente disse que era o problema, antes
  do diagnóstico real (SOM — Régua da Desculpa). Preencher isso desde o
  início é o que faz o Case, lá na frente, ter uma história completa de
  "antes e depois".
- **Custo mensal**: só relevante para "Cliente externo"; ajuda a
  justificar o Case depois em termos de ROI.

## 3. Alimentar conhecimento

Não é obrigatório por projeto, mas é o que faz o sistema ficar mais
inteligente com o tempo. **Conhecimento → Registrar Ativo**:

- Sempre que uma pergunta ou objeção nova aparecer numa conversa com
  esse cliente que não está no Banco de Perguntas Recorrentes, capture-a
  (via Quick Capture ou direto na tela de Conhecimento).
- Aprendizados genuínos do projeto (o que funcionou, o que não funcionou)
  viram Ativos de Conhecimento — não espere o projeto acabar para
  registrar, capture no momento em que acontece.

Isso não é burocracia: é o que permite, no futuro, sugerir o framework
certo para um Case sem case (Conteúdo → "Sem case pessoal? Siga a
árvore").

## 4. Iniciar conteúdo

Duas origens possíveis:

- **Autônoma**, direto em Conteúdo → Nova Peça — quando a ideia não
  depende ainda de um resultado do projeto.
- **A partir de um Case**, quando o projeto já tiver os 6 campos de
  Case completos (Projetos → Progresso dos 6 campos) — o sistema cria
  automaticamente uma Peça de Conteúdo ligada ao Case
  (`Criar Case a partir deste Projeto`).

Não force conteúdo antes de o projeto ter alguma substância real — o
sistema não impede, mas o SOM inteiro é sobre nunca postar antes de ter
o que dizer.

## 5. Como acompanhar

Não existe hoje uma "página do cliente" única mostrando tudo num só
lugar (Lead de origem, Projeto, Conteúdo relacionado, Alertas). O
acompanhamento real hoje é feito em três telas separadas:

- **Clientes** — status e classificação, lista simples.
- **Projetos** — progresso dos 6 campos de Case, Critérios de Lançamento,
  Build Logs.
- **Alertas** — `build_log_ausente` é o Alerta mais provável de aparecer
  para um projeto novo (21 dias sem Build Log) — se você seguiu a rotina
  de Terça-feira ([`OPERATION_GUIDE.md`](OPERATION_GUIDE.md)), isso não
  deveria acontecer.

Anote o nome do cliente/projeto em algum lugar seu (um bloco de notas,
uma planilha) até existir uma visão unificada — ver
[`BACKLOG_V2.md`](BACKLOG_V2.md), item "Página de detalhe do Cliente".
