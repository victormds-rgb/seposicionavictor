# DOMAIN_MODEL.md
### SEPosicionaVictor — Modelagem de Domínio (DDD)

Este documento modela o domínio puro do sistema pessoal de Victor Sousa. Nenhuma decisão de tecnologia, banco de dados ou interface é tomada aqui. Toda entidade é rastreável ao Sistema Operacional da Marca (SOM) e ao SOFTWARE_SPEC.md (SS) já aprovados.

> **Nota de precedência**: a classificação de cada elemento abaixo (Entity, Aggregate Root, etc.) foi posteriormente revisada e simplificada durante a sessão de "Revisão Arquitetural do Domínio" (registrada no histórico do projeto, anterior ao DATABASE.md). A revisão reclassificou Framework, TemaMapeado, RegraDeDecisao, SerieFixa e Pilar como **Reference Data** (não Entity/Aggregate Root), CriterioDeLancamento como **entidade interna do agregado Projeto** (não Aggregate Root próprio), e SugestaoIA como **Entity de log produzida por Domain Service** (não Aggregate Root). O DATABASE.md já reflete essa revisão. Este documento permanece como registro histórico da modelagem original — em caso de conflito de classificação, a Revisão Arquitetural e o DATABASE.md prevalecem, conforme o próprio ENGINEERING_MANIFEST.md.

---

## PARTE 1 — ENTIDADES

### 1. Fundamento

**Responsabilidade:** Representar a constituição imutável da marca.

**Atributos principais:** filosofia, big_idea, frase_ancora, manifesto, princípios_operacionais (5), nao_e (lista), versão, histórico_de_alteração.

**Estados possíveis:** `ativo`, `em_revisao`.

**Ciclo de vida:** Criado uma vez; transita para `em_revisao` apenas por ação humana deliberada diante de contradição grave (SOM 8.3); nunca é removido.

**Regras de negócio:** Só editável por ação humana explícita, nunca por sugestão automática de IA.

**Invariantes:** Nunca existe mais de uma instância ativa. Nunca é alterado como efeito colateral de outra entidade.

**Relacionamentos:** Fundamenta Framework, RegraDeDecisao, AtivoDeConhecimento.

**Eventos que produz:** `fundamento.revisado`, `fundamento.entrou_em_revisao`.

**Eventos que consome:** `contradicao_grave.detectada` (disparo manual).

---

### 2. Framework

**Responsabilidade:** Representar um modelo mental reutilizável (Diagnóstico Antes da Ferramenta, Régua da Desculpa, Quebra-Recuo-Volta, Coringa vs. Sob Medida).

**Atributos principais:** nome, estrutura_de_etapas, temas_aplicáveis, exemplos_de_uso.

**Estados possíveis:** `ativo`, `candidato_a_termo_proprio`.

**Ciclo de vida:** Os 4 iniciais nascem do SOM; novos nascem quando um padrão real se repete.

**Relacionamentos:** Aplicado por PecaDeConteudo; mapeado por TemaMapeado.

**Eventos que produz:** `framework.aplicado_em_conteudo`, `framework.repeticao_terceiro_detectada`.

---

### 3. TemaMapeado

**Responsabilidade:** Associar um dos 18 temas ao(s) framework(s) aplicável(is) (Cap. 2.5).

**Atributos principais:** nome_do_tema, frameworks_associados.

**Regras de negócio:** Todo tema deve ter framework associado antes de uso sem case (árvore 2.6).

**Relacionamentos:** N:N com Framework; referenciado por PecaDeConteudo.

**Eventos que produz:** `tema.remapeado`.

---

### 4. AtivoDeConhecimento

**Responsabilidade:** Representar o Banco de Perguntas Recorrentes (Cap. 2.3) e o Banco de Analogias/Metáforas (Cap. 2.4).

**Atributos principais:** tipo (`pergunta_recorrente` / `analogia`), conteudo_textual, origem, frequência_de_uso.

**Estados possíveis:** `ativo`, `arquivado`.

**Relacionamentos:** Referenciado por PecaDeConteudo.

**Eventos que produz:** `ativo_conhecimento.criado`.

---

### 5. RegraDeDecisao

**Responsabilidade:** Representar as árvores de decisão formais do SOM (Cap. 7.1; Cap. 2.6).

**Atributos principais:** nome, estrutura_de_perguntas, ramificações.

**Invariantes:** Estrutura nunca alterada por sugestão automática de IA.

**Relacionamentos:** Aplicada a Cliente e a RegistroBruto/PecaDeConteudo sem case.

**Eventos que produz:** `regra_decisao.aplicada`.

---

### 6. RegistroBruto

**Responsabilidade:** Capturar qualquer entrada não estruturada antes de classificação (Cap. 9.10, SS RF-4.1).

**Atributos principais:** texto_bruto, data_captura, origem, reuniao_associada (opcional), status.

**Estados possíveis:** `capturado`, `classificacao_sugerida`, `classificado`, `descartado`.

**Regras de negócio:** Nunca classificado automaticamente sem confirmação humana.

**Invariantes:** Classificação final é sempre ação humana.

**Relacionamentos:** Pode originar-se de uma Reuniao; pode gerar Case (via Projeto), BuildLog, PecaDeConteudo, Tarefa, AtivoDeConhecimento.

**Eventos que produz:** `registro_bruto.criado`, `registro_bruto.classificado`.

---

### 7. Reuniao

**Responsabilidade:** Representar um encontro real com cliente, lead ou parceiro.

**Atributos principais:** data_hora, participantes, cliente_ou_projeto_associado, local, notas_brutas, status.

**Estados possíveis:** `agendada`, `realizada`, `processada`, `cancelada`.

**Invariantes:** Nunca `processada` sem RegistroBruto associado classificado.

**Relacionamentos:** Pode estar associada a Cliente/Projeto; gera RegistroBruto; agendada via ItemDeAgenda.

**Eventos que produz:** `reuniao.agendada`, `reuniao.encerrada`, `reuniao.processada`.

---

### 8. ItemDeAgenda

**Responsabilidade:** Representar compromisso ou bloco de tempo — reunião, rotina fixa (Cap. 9.4), ou tarefa com prazo.

**Atributos principais:** tipo, data_hora, referência_à_entidade_de_origem, recorrente (bool).

**Estados possíveis:** `agendado`, `concluido`, `perdido`.

**Relacionamentos:** Pode referenciar Reuniao ou Tarefa.

**Eventos que produz:** `item_agenda.criado`, `item_agenda.concluido`, `item_agenda.perdido`.

---

### 9. Cliente

**Responsabilidade:** Representar empresa/pessoa contratante, classificada pela árvore do Cap. 7.1.

**Atributos principais:** nome, setor, tem_autoridade_real, aceita_diagnostico, sinal_nao_cumprimento, classificacao_resultante, urgencia_financeira.

**Estados possíveis:** `lead`, `em_avaliacao`, `ativo`, `encerrado`.

**Invariantes:** Nunca classificado `ativo` sem passar pela árvore completa.

**Relacionamentos:** Possui Projeto(s); associado a Reuniao(ões).

**Eventos que produz:** `cliente.avaliado`, `cliente.classificado`, `cliente.encerrado`.

---

### 10. Projeto

**Responsabilidade:** Representar trabalho concreto — para Cliente externo ou produto próprio.

**Atributos principais:** nome, tipo, cliente_associado, desculpa_inicial, custo_mensal, momento_quebra, solucao, tempo_decorrido, numero_resultado, status.

**Estados possíveis:** `iniciado`, `em_andamento`, `pronto_para_case`, `encerrado`.

**Invariantes:** Projeto `cliente_externo` nunca existe sem desculpa+custo desde a criação.

**Relacionamentos:** Pertence a Cliente; gera Case; gera BuildLog; possui CriterioDeLancamento(s).

**Eventos que produz:** `projeto.iniciado`, `projeto.campo_atualizado`, `projeto.pronto_para_case`, `projeto.encerrado`.

---

### 11. CriterioDeLancamento

**Responsabilidade:** Validar o critério "ficou muito bom, vai me ajudar" (Cap. 7.2).

**Atributos principais:** descricao_feature, projeto_associado, status, data_confirmacao.

**Estados possíveis:** `pendente`, `satisfeito`.

**Relacionamentos:** Pertence a Projeto.

**Eventos que produz:** `criterio_lancamento.satisfeito`.

---

### 12. Case

**Responsabilidade:** Representar prova pública estruturada em 6 campos fixos (Cap. 5.1).

**Atributos principais:** desculpa, custo, momento_quebra, solucao, tempo, numero_resultado, canal_sugerido, canal_escolhido, historico_de_edicao.

**Estados possíveis:** `incompleto`, `completo`, `publicado`.

**Invariantes:** Nunca `completo` com campo ausente. Histórico de edição imutável.

**Relacionamentos:** Originado de Projeto; gera PecaDeConteudo.

**Eventos que produz:** `case.completo`, `case.publicado`.

---

### 13. BuildLog

**Responsabilidade:** Registro de construção em público (Contexto/Quebra/Decisão/Próximo Passo — Cap. 4.4).

**Atributos principais:** contexto, quebra, decisao, proximo_passo, projeto_associado, data_publicacao, status.

**Estados possíveis:** `rascunho`, `publicado`.

**Invariantes:** Nunca publicado sem os 4 campos preenchidos.

**Eventos que produz:** `build_log.publicado`.

---

### 14. PecaDeConteudo

**Responsabilidade:** Unidade de conteúdo publicável.

**Atributos principais:** tema, framework_aplicado, canal, serie_fixa, pilar, status, origem, pecas_derivadas.

**Estados possíveis:** `rascunho`, `em_revisao`, `agendado`, `publicado`.

**Invariantes:** Nunca existe derivação onde a origem é mais curta que a derivada (Cap. 9.8). Todo conteúdo publicado tem pilar atribuído.

**Eventos que produz:** `conteudo.criado`, `conteudo.publicado`, `derivacao.criada`.

---

### 15. SerieFixa

**Responsabilidade:** As 4 séries recorrentes (Cap. 9.2).

**Atributos principais:** nome, dia_da_semana_padrao, framework_tipico.

---

### 16. Pilar

**Responsabilidade:** Os 5 pilares editoriais e peso-alvo (Cap. 9.1).

**Atributos principais:** nome, peso_alvo_percentual, peso_real (calculado).

**Regras de negócio:** Soma dos 5 pesos-alvo = 100%.

---

### 17. Tarefa

**Responsabilidade:** Ação concreta a executar.

**Atributos principais:** descricao, origem, entidade_relacionada, prazo, status.

**Estados possíveis:** `pendente`, `em_andamento`, `concluida`, `cancelada`.

**Eventos que produz:** `tarefa.criada`, `tarefa.concluida`.

---

### 18. Alerta

**Responsabilidade:** Notificação disparada por condição do sistema (Cap. 8).

**Atributos principais:** tipo, condicao_gatilho, data_disparo, entidade_relacionada, status.

**Estados possíveis:** `ativo`, `reconhecido`, `resolvido`.

**Invariantes:** `build_log_ausente` só resolvido pela publicação de novo BuildLog.

**Eventos que produz:** `alerta.disparado`, `alerta.resolvido`.

---

### 19. AuditoriaDeDrift

**Responsabilidade:** Execução trimestral da revisão de 20 conteúdos (Cap. 8.2).

**Atributos principais:** data_execucao, pecas_avaliadas, percentual_falha, recomendacao_gerada.

**Estados possíveis:** `agendada`, `em_execucao`, `concluida`.

**Invariantes:** Nunca altera o Fundamento diretamente.

**Eventos que produz:** `auditoria.concluida`, `auditoria.falha_critica_detectada`.

---

### 20. SugestaoDeIA

**Responsabilidade:** Representar toda sugestão gerada por IA que exige confirmação humana.

**Atributos principais:** tipo_sugestao, entidade_alvo, conteudo_sugerido, confianca, status, data.

**Estados possíveis:** `pendente`, `aceita`, `rejeitada`, `editada_e_aceita`.

**Invariantes:** Nunca transiciona sozinha para `aceita` sem ação humana correspondente.

**Eventos que produz:** `sugestao.gerada`, `sugestao.aceita`, `sugestao.rejeitada`.

---

## PARTE 2 — BOUNDED CONTEXTS

- **Sistema Operacional da Marca** — Fundamento.
- **Conhecimento** — Framework, TemaMapeado, RegraDeDecisao, AtivoDeConhecimento.
- **Reuniões** — Reuniao.
- **Agenda** — ItemDeAgenda.
- **Clientes** — Cliente.
- **Projetos** — Projeto, CriterioDeLancamento.
- **Cases** — Case.
- **Build Logs** — BuildLog.
- **Conteúdo** — PecaDeConteudo, SerieFixa, Pilar.
- **Registros Brutos** — RegistroBruto.
- **Tarefas** — Tarefa.
- **Notificações** — Alerta, AuditoriaDeDrift.
- **IA / Assistência Inteligente** — SugestaoDeIA.

---

## PARTE 3 — GLOSSÁRIO DO DOMÍNIO

| Termo | Definição |
|---|---|
| Mentira confortável / Desculpa | Explicação usada para não encarar o problema real de crescimento |
| Diagnóstico | Identificar a mentira confortável antes de aplicar qualquer ferramenta |
| Framework | Modelo mental reutilizável para aplicar a lente da marca a qualquer tema |
| Build Log | Registro público de progresso de produto próprio |
| Case | Prova pública estruturada de resultado |
| Drift | Desvio da marca em relação ao Fundamento |
| Pilar | Categoria de distribuição editorial de conteúdo |
| Registro Bruto | Qualquer entrada não estruturada de informação |
| Fundamento | A constituição imutável da marca |

---

## PARTE 4 — EVENTOS E DECISÕES DE MODELAGEM

Ver DATABASE.md para a lista final consolidada de eventos (21) e as Decisões de Modelagem D1–D9, que substituem e detalham as decisões implícitas deste documento original.

## PARTE 5 — RISCOS E AMBIGUIDADES

1. Fronteira entre RegistroBruto e Reuniao não é definida com precisão absoluta pelo SOM.
2. Limiar de "urgência financeira" em Cliente é dado externo, não regra do SOM.
3. AtivoDeConhecimento pode crescer sem controle de qualidade formalmente definido.
4. Taxa de rejeição de sugestões de IA como sinal de qualidade não é regra de domínio.
5. Sobreposição entre Alerta e ItemDeAgenda atravessa três Bounded Contexts.
