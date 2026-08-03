# DATABASE.md
### SEPosicionaVictor — Schema de Persistência (versão final, pós-revisão DDD + refinamentos)

Banco pensado para sistema pessoal, usuário único. Sem particionamento, sharding ou infraestrutura distribuída.

---

## Aggregate Roots (13 no domínio original + Lead e DocumentoOficial adicionados no refinamento pré-ARCHITECTURE)

Fundamento, RegistroBruto (evoluído para Inbox Universal), Reuniao, ItemDeAgenda, Cliente, Projeto (com CriterioDeLancamento interno), Case, BuildLog, PecaDeConteudo, Tarefa, Alerta, AuditoriaDeDrift, AtivoDeConhecimento, **Lead** (Pipeline Comercial), **DocumentoOficial** (Brand Intelligence).

Framework, TemaMapeado, RegraDeDecisao, SerieFixa, Pilar são **Reference Data**. SugestaoIA é **Entity de log**, produzida por Domain Service, sem autoridade própria de agregado.

---

## Tabelas — Aggregate Roots

### `fundamento`
id (uuid PK), filosofia (text), big_idea (text), frase_ancora (text), manifesto (text), principios_operacionais (jsonb), nao_e (jsonb), status (enum: ativo, em_revisao), versao (integer), created_at, updated_at. Sem soft delete — nunca removido.

### `fundamento_historico`
id (uuid PK), fundamento_id (FK → fundamento), versao (integer), snapshot (jsonb), alterado_em (timestamp), motivo (text, nullable). Append-only.

### `registro_bruto` (Inbox Universal)
id (uuid PK), **tipo_entrada** (enum: texto, audio, imagem, pdf, video, print, email, documento, link, mensagem, observacao, transcricao, outro), conteudo_texto (text, nullable), conteudo_binario_ref (text, nullable), mime_type (text, nullable), tamanho_bytes (bigint, nullable), data_captura (timestamp), origem (enum: reuniao, aprendizado, ideia, email, whatsapp, outro), reuniao_id (FK, nullable), status (enum: capturado, **em_processamento**, classificacao_sugerida, classificado, descartado), metadata (jsonb, nullable), created_at, updated_at.

### `registro_bruto_destino`
id (uuid PK), registro_bruto_id (FK), tipo_destino (enum: projeto, build_log, peca_conteudo, tarefa, ativo_conhecimento), destino_id (uuid, referência de aplicação, sem FK de banco), created_at.

### `reuniao`
id (uuid PK), data_hora (timestamp), participantes (jsonb, nullable), cliente_id (FK, nullable), projeto_id (FK, nullable), local (text, nullable), notas_brutas (text, nullable), status (enum: agendada, realizada, processada, cancelada), metadata (jsonb, nullable), created_at, updated_at.

### `item_agenda`
id (uuid PK), tipo (enum: reuniao, rotina_fixa, tarefa_com_prazo), data_hora (timestamp), reuniao_id (FK, nullable), tarefa_id (FK, nullable), rotina_fixa_referencia (text, nullable), recorrente (boolean), status (enum: agendado, concluido, perdido), created_at, updated_at. Índice: (data_hora).

### `cliente`
id (uuid PK), nome (text), setor (text, nullable), tem_autoridade_real (boolean, nullable), aceita_diagnostico (boolean, nullable), sinal_nao_cumprimento (boolean, nullable), classificacao_resultante (enum: prioridade_alta, cliente_de_caixa, exigir_contrato_reforcado, nullable), urgencia_financeira (enum: baixa, media, alta, nullable), status (enum: lead, em_avaliacao, ativo, encerrado), metadata (jsonb, nullable), created_at, updated_at.

### `projeto`
id (uuid PK), nome (text), tipo (enum: cliente_externo, produto_proprio), cliente_id (FK, nullable), desculpa_inicial (text, nullable — obrigatório na aplicação se cliente_externo), custo_mensal (numeric, nullable — idem), momento_quebra (text, nullable), solucao (text, nullable), tempo_decorrido (text, nullable), numero_resultado (text, nullable), status (enum: iniciado, em_andamento, pronto_para_case, encerrado), metadata (jsonb, nullable), created_at, updated_at.

### `criterio_lancamento`
id (uuid PK), projeto_id (FK, CASCADE delete), descricao_feature (text), status (enum: pendente, satisfeito), data_confirmacao (timestamp, nullable), created_at, updated_at.

### `case`
id (uuid PK), projeto_id (FK), desculpa (text), custo (numeric), momento_quebra (text), solucao (text), tempo (text), numero_resultado (text), canal_sugerido (enum, nullable), canal_escolhido (enum, nullable), status (enum: incompleto, completo, publicado), metadata (jsonb, nullable), created_at, updated_at.

### `case_historico`
id (uuid PK), case_id (FK), snapshot (jsonb), alterado_em (timestamp). Append-only.

### `build_log`
id (uuid PK), projeto_id (FK), contexto (text), quebra (text), decisao (text), proximo_passo (text), status (enum: rascunho, publicado), data_publicacao (timestamp, nullable), metadata (jsonb, nullable), created_at, updated_at. Índice: (data_publicacao).

### `peca_conteudo`
id (uuid PK), tema_id (FK → tema_mapeado), framework_id (FK, nullable), canal (enum), serie_fixa_id (FK, nullable), pilar_id (FK), status (enum: rascunho, em_revisao, agendado, publicado), origem_tipo (enum: case, build_log, autonomo), origem_case_id (FK, nullable), origem_build_log_id (FK, nullable), peca_origem_id (FK self, nullable), conteudo_texto (text, nullable), data_publicacao (timestamp, nullable), metadata (jsonb, nullable), created_at, updated_at. Índice: (pilar_id, status, data_publicacao).

### `tarefa`
id (uuid PK), descricao (text), origem (enum: manual, registro_bruto, alerta), registro_bruto_id (FK, nullable), alerta_id (FK, nullable), entidade_relacionada_tipo (enum, nullable), entidade_relacionada_id (uuid, nullable, sem FK), prazo (timestamp, nullable), status (enum: pendente, em_andamento, concluida, cancelada), metadata (jsonb, nullable), created_at, updated_at.

### `alerta`
id (uuid PK), tipo (enum: build_log_ausente, auditoria_devida, desvio_pilares), condicao_gatilho (text), entidade_relacionada_tipo (text, nullable), entidade_relacionada_id (uuid, nullable), status (enum: ativo, reconhecido, resolvido), data_disparo (timestamp), data_resolucao (timestamp, nullable), metadata (jsonb, nullable), created_at, updated_at.

### `auditoria_drift`
id (uuid PK), data_execucao (timestamp), pecas_avaliadas (jsonb), percentual_falha (numeric, nullable), recomendacao_gerada (text, nullable), status (enum: agendada, em_execucao, concluida), created_at, updated_at.

### `ativo_conhecimento`
id (uuid PK), tipo (enum: pergunta_recorrente, analogia), conteudo_textual (text), origem (text, nullable), frequencia_uso (integer, default 0), status (enum: ativo, arquivado), created_at, updated_at.

### `lead` (Pipeline Comercial)
id (uuid PK), nome (text), origem_lead (text, nullable), sdr_responsavel (text, nullable), temperatura (enum: frio, morno, quente, nullable), ticket_estimado (numeric, nullable), status_comercial (enum: novo, qualificando, qualificado, agendado, reunido, convertido_cliente, perdido), metadata (jsonb, nullable), created_at, updated_at.

### `qualificacao_lead`
id (uuid PK), lead_id (FK), resumo_qualificacao (text, nullable), dores_identificadas (jsonb, nullable), objecoes (text, nullable), proximo_passo (text, nullable), documentos_enviados (jsonb, nullable), links_relevantes (jsonb, nullable), created_at, updated_at.

### `agendamento_comercial`
id (uuid PK), lead_id (FK), google_calendar_event_id (text, nullable), data_hora (timestamp), status (enum: agendado, confirmado, realizado, no_show, cancelado), reuniao_id (FK, nullable), created_at, updated_at.

### `documento_oficial` (Brand Intelligence)
id (uuid PK), titulo (text), google_drive_file_id (text, unique), tipo_documento (enum: sistema_operacional_marca, manual_marca, outro), ultima_sincronizacao (timestamp, nullable), hash_conteudo (text, nullable), status_indexacao (enum: nao_indexado, indexado, desatualizado, erro), metadata (jsonb, nullable), created_at, updated_at.

### `documento_chunk_indexado`
id (uuid PK), documento_id (FK), conteudo_chunk (text), embedding_ref (text, nullable), ordem (integer), created_at.

---

## Tabelas — Reference Data

### `framework`
id (uuid PK), nome (text), estrutura_etapas (jsonb), exemplos_uso (text, nullable), status (enum: ativo, candidato_a_termo_proprio, obsoleto), created_at, updated_at.

### `tema_mapeado`
id (uuid PK), nome_tema (text, unique), created_at, updated_at.

### `tema_framework` (N:N)
tema_id (FK), framework_id (FK) — PK composta.

### `regra_decisao`
id (uuid PK), nome (text), estrutura_arvore (jsonb), aplica_a (enum: cliente, conteudo_sem_case), created_at, updated_at.

### `serie_fixa`
id (uuid PK), nome (text), dia_semana_padrao (text, nullable), framework_tipico_id (FK, nullable), status (enum: ativa, obsoleta).

### `pilar`
id (uuid PK), nome (text), peso_alvo_percentual (numeric). Soma dos 5 pesos-alvo = 100 (validação de aplicação).

---

## Tabela — Entity de Log

### `sugestao_ia`
id (uuid PK), tipo_sugestao (enum: classificacao, framework, canal, rascunho, qualificacao_lead), entidade_origem_tipo (text), entidade_origem_id (uuid), entidade_alvo_tipo (text, nullable), entidade_alvo_id (uuid, nullable), conteudo_sugerido (jsonb), provider (text, nullable), modelo (text, nullable), prompt_version (text, nullable), temperatura (numeric, nullable), tokens_input (integer, nullable), tokens_output (integer, nullable), custo_estimado (numeric, nullable), tempo_resposta_ms (integer, nullable), confianca (numeric, nullable), origem_da_sugestao (enum: domain_service, agente_comercial, brand_intelligence, nullable), status (enum: pendente, aceita, rejeitada, editada_e_aceita), metadata (jsonb, nullable), created_at, updated_at. Índice: (provider, modelo, created_at).

---

## Tabela — Observabilidade (não é Event Sourcing)

### `event_log`
id (uuid PK), aggregate (text), aggregate_id (uuid), event_name (text), payload (jsonb), actor_tipo (enum: humano, ia, sistema), actor_id (text, nullable), source (text, nullable), correlation_id (uuid, nullable), created_at (timestamp). Índices: (aggregate, aggregate_id, created_at), (correlation_id), (created_at). Append-only, nunca fonte de reconstrução de estado.

---

## Relacionamentos, cardinalidade e cascatas (resumo)

- cliente 1—N projeto (RESTRICT)
- projeto 1—N criterio_lancamento (CASCADE)
- projeto 1—N case (RESTRICT) — modelado 1-N, não 1-1, para permitir reabertura futura
- projeto 1—N build_log (RESTRICT)
- case 1—N case_historico (CASCADE, append-only)
- case 1—N peca_conteudo (SET NULL)
- build_log 1—N peca_conteudo (SET NULL)
- peca_conteudo 1—N peca_conteudo (auto-relacionamento de derivação, SET NULL)
- tema_mapeado N—N framework (via tema_framework)
- pilar 1—N peca_conteudo (RESTRICT)
- registro_bruto 1—N registro_bruto_destino (CASCADE)
- reuniao 1—N registro_bruto (SET NULL)
- alerta 1—N tarefa (SET NULL)
- lead 1—N qualificacao_lead, agendamento_comercial
- documento_oficial 1—N documento_chunk_indexado (CASCADE — chunks são sempre recriáveis a partir do Drive)

## Diagrama ER textual (resumo)

```
fundamento 1—N fundamento_historico
cliente 1—N projeto 1—N reuniao
projeto 1—N criterio_lancamento
projeto 1—N case 1—N case_historico
projeto 1—N build_log
case 1—N peca_conteudo
build_log 1—N peca_conteudo
peca_conteudo 1—N peca_conteudo (derivação)
tema_mapeado N—N framework
pilar 1—N peca_conteudo
registro_bruto 1—N registro_bruto_destino
reuniao 1—N registro_bruto
alerta 1—N tarefa
lead 1—N qualificacao_lead
lead 1—N agendamento_comercial
documento_oficial 1—N documento_chunk_indexado
```

## Classificação de volume e mutabilidade

- **Altamente transacional:** registro_bruto, tarefa, peca_conteudo, item_agenda, sugestao_ia, lead
- **Transacional moderado:** reuniao, case, build_log, alerta, cliente, projeto, agendamento_comercial
- **Praticamente imutável:** fundamento, fundamento_historico, case_historico
- **Configuração (Reference Data):** framework, tema_mapeado, tema_framework, regra_decisao, serie_fixa, pilar
- **Pode crescer muito:** peca_conteudo, registro_bruto, sugestao_ia, tarefa, event_log
- **Candidatas a arquivamento futuro:** tarefa (concluídas antigas), sugestao_ia (rejeitadas antigas), alerta (resolvidos antigos), item_agenda (passados)

---

## Decisões de Engenharia do Banco (D1–D9 do Domain, + DE1–DE6 do refinamento)

**D1–D9** (herdadas da Revisão Arquitetural do Domínio): Fundamento separado de Framework/RegraDeDecisao; RegistroBruto como entrada universal; Case e Projeto separados (snapshot, não referência viva); CriterioDeLancamento um-para-muitos com Projeto; Notificações com autoridade apenas de recomendação sobre o Fundamento; Pilar com peso_real sempre calculado, nunca armazenado; AtivoDeConhecimento consolidando os dois bancos do Cap. 2.3/2.4; Reuniao e ItemDeAgenda como entidades novas necessárias para os objetivos O1/O4 do SOFTWARE_SPEC; SugestaoDeIA como entidade própria centralizando o padrão sugestão→confirmação.

**DE1 — Referências polimórficas sem FK de banco.** Motivo: sistema de usuário único não justifica tabela de "entidades genéricas"; integridade garantida pela aplicação.

**DE2 — `jsonb` para listas pequenas e estruturas fixas.** Motivo: evita joins desnecessários para dados sempre lidos como bloco único.

**DE3 — CriterioDeLancamento com CASCADE delete a partir de Projeto.** Motivo: entidade interna do agregado, nunca órfã.

**DE4 — Case com relação 1-N para Projeto.** Motivo: preserva possibilidade de reavaliação futura sem custo real de complexidade.

**DE5 — Ausência de particionamento/sharding.** Motivo: fora de escopo para usuário único.

**DE6 — `pilar.peso_real` nunca persistido.** Motivo: evita dessincronização; sempre consulta agregada.

**Refinamentos pré-ARCHITECTURE (Inbox Universal, metadata, SugestaoIA ampliada, EventLog, Pipeline Comercial, Brand Intelligence):** ver ARCHITECTURE.md, seções 19–21, para a justificativa arquitetural completa de cada um. Em resumo: RegistroBruto passou a aceitar qualquer tipo de mídia (estado `em_processamento` cobre transcrição/OCR assíncrono); campo `metadata` (jsonb) adicionado às tabelas transacionais para evolução futura sem migration, nunca substituindo coluna de domínio; SugestaoIA ganhou campos de auditoria completa de uso de IA (provider, modelo, tokens, custo); `event_log` foi criado como observabilidade pura (não Event Sourcing); Pipeline Comercial (Lead, Qualificação, Agendamento Comercial) e Brand Intelligence (DocumentoOficial, DocumentoChunkIndexado) nasceram como novos Bounded Contexts com seus próprios Aggregate Roots, seguindo ADR-007.
