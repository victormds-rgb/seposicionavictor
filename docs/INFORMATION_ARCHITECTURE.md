# INFORMATION_ARCHITECTURE.md
### SEPosicionaVictor — Arquitetura da Informação

## 1. Filosofia da Informação

Organização por contexto (não por tipo técnico de domínio); proximidade semântica; previsibilidade (a informação não muda de lugar sem justificativa forte); simplicidade (menos categorias bem definidas); consistência de nomenclatura (mesmo conceito, mesmo nome, sempre).

## 2. Modelo Mental

Fluxo: Capturar → Processar → Executar → Publicar → Aprender → Melhorar. Vitor nunca pensa em "módulos" ou "bounded contexts" — pensa nesse fluxo natural de trabalho. Capturar = Inbox; Processar = classificação assistida; Executar = Clientes/Projetos/Pipeline Comercial; Publicar = Conteúdo (via Case/Build Log); Aprender = Conhecimento + Brand Intelligence (pano de fundo, não etapa isolada); Melhorar = Alertas/Auditoria de Drift.

## 3. Taxonomia

Registro (Inbox) — Capturar. Reunião — Capturar. Lead — Capturar/Executar inicial. Cliente — Executar. Projeto — Executar. Tarefa — Executar. Case — Publicar. Build Log — Publicar. Conteúdo (Peça) — Publicar. Framework/Tema/Pergunta/Analogia — Aprender. Documento Oficial — Aprender. Alerta — Melhorar. Auditoria de Drift — Melhorar. Missão (futuro) — Executar/Publicar orquestrado.

## 4. Hierarquia

Cliente contém Projeto(s), referencia Reuniões. Projeto contém Critério(s) de Lançamento (se produto próprio), gera (não contém) Case e Build Log. Case gera Peças de Conteúdo, nunca contém outro Case. Peça de Conteúdo referencia origem e derivação, nunca contém outra peça. Registro (Inbox) referencia destinos, nunca é contido. Lead referencia Cliente resultante, nunca é o mesmo registro. Tarefa referencia qualquer entidade, nunca contém. Alerta referencia origem, pode gerar (referência) Tarefa.

## 5. Estrutura de Navegação

É módulo quando: tem fluxo de decisão próprio, frequente, buscado independentemente. É aba quando: só faz sentido no contexto de outra entidade mas tem volume/complexidade própria (Case e Build Log são abas de Projeto). É apenas detalhe quando: só relevante junto da entidade de origem (histórico de edição, justificativa de sugestão de IA, participantes de reunião).

## 6. Convenções de Nomenclatura

Menus/módulos: substantivo plural direto. Botões de ação primária: verbo infinitivo curto. Ações destrutivas: verbo explícito, nunca ambíguo. Estados: adjetivo/particípio consistente. Mensagens de sistema: frase curta, tom direto (coerente com Voz e Tom do SOM). Nomes de Framework/Série Fixa: exatamente os do SOM, nunca abreviados.

## 7. Relacionamentos

Cliente↔Projeto (sempre navegável entre si). Projeto↔Case (Case sempre acessa o Projeto de origem). Projeto↔Conteúdo via Case/Build Log. Inbox↔tudo (central de origem, nunca de destino). Conhecimento↔Conteúdo (biblioteca compartilhada, nunca exclusiva de uma peça). Brand Intelligence↔qualquer geração de IA (contexto transversal, nunca anexo de entidade específica).

## 8. Estrutura de Busca

Resultados mostram tipo explícito antes do nome. Priorização por recência/frequência de uso, sem esconder resultados menos usados. Agrupamento por tipo, um único nível (sem subgrupos). Tela de detalhe já mostra entidades relacionadas mais relevantes.

## 9. URLs Conceituais

```
/dashboard
/inbox, /inbox/:registro_id
/agenda, /agenda/:item_id
/pipeline, /pipeline/leads, /pipeline/leads/:lead_id
/clientes, /clientes/:cliente_id, /clientes/:cliente_id/projetos
/projetos, /projetos/:projeto_id, /projetos/:projeto_id/case, /projetos/:projeto_id/build-logs
/conteudo, /conteudo/:peca_id, /conteudo/series/:serie_id
/conhecimento/frameworks/:framework_id, /conhecimento/temas/:tema_id
/brand-intelligence, /brand-intelligence/documentos/:documento_id
/alertas, /alertas/:alerta_id
/missoes (futuro), /missoes/:missao_id
/configuracoes
```

Princípio: a URL reflete a Hierarquia — o que é "aba" vive como subrota, nunca rota de primeiro nível própria (não existe `/case/:id` isolado).

## 10. Evolução

Todo novo tipo de entidade passa pelo critério da seção 5 antes de ganhar espaço na navegação. Toda nova entidade é posicionada no Modelo Mental (seção 2) primeiro. Missões entram como módulo de primeiro nível (orquestram Executar+Publicar). Knowledge Graph e Memory não recebem módulo próprio (enriquecimento, não fluxo de decisão). Agents/Capabilities não alteram a Taxonomia do ponto de vista de Victor.
