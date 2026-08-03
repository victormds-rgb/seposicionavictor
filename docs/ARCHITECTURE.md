# ARCHITECTURE.md
### SEPosicionaVictor — Arquitetura de Software

## 1. Visão Geral da Arquitetura

Sistema pessoal, monousuário, orientado a domínio (DDD), com uma Inbox Universal como porta de entrada, uma camada de IA assistiva que nunca decide sozinha, e um módulo de Brand Intelligence que trata o Google Drive como fonte oficial de verdade documental. A arquitetura prioriza simplicidade operacional sobre escalabilidade.

## 2. Princípios Arquiteturais

1. Domínio antes de tecnologia.
2. IA sugere, humano decide — nenhum Domain Service de IA escreve diretamente em Aggregate Root.
3. Simplicidade sobre escalabilidade — monolito modular, banco único, sem filas distribuídas complexas.
4. Auditoria centralizada, não espalhada (`event_log`, `case_historico`, `fundamento_historico`).
5. Fonte de verdade explícita e única por tipo de dado (Google Drive para documentos oficiais; banco relacional para estado operacional).
6. Menor superfície de integração possível — Google Workspace como único conjunto de integrações externas nesta fase.

## 3. Organização do Projeto

Monolito modular por Bounded Context:

```
/src
  /fundamento /conhecimento /inbox /reunioes /agenda /clientes /projetos
  /cases /build_logs /conteudo /tarefas /notificacoes /ia
  /pipeline_comercial /brand_intelligence /event_log /shared
/infra
  /persistence /integrations/{google_calendar,google_drive,gmail} /scheduler
```

## 4. Bounded Contexts

Os 12 originais (Sistema Operacional da Marca, Conhecimento, Reuniões, Agenda, Clientes, Projetos, Cases, Build Logs, Conteúdo, Registros Brutos/Inbox, Tarefas, Notificações, IA), acrescidos de **Pipeline Comercial** e **Brand Intelligence**.

## 5. Camadas da Aplicação

Domain (regras puras, sem I/O) → Application (orquestra casos de uso) → Infrastructure (implementa portas). Presentation depende de Application. Regra de dependência: Presentation → Application → Domain ← Infrastructure.

## 6. Fluxo Completo de uma Informação

Captura → Persistência inicial (RegistroBruto) → Pré-processamento (se necessário) → Classificação por IA (SugestaoIA) → Confirmação humana → Efeito no domínio → Persistência final → Notificação (se aplicável) → `event_log`.

## 7. Arquitetura dos Domain Services

AvaliadorDeCliente, ClassificadorDeRegistroBruto, ValidadorDeDerivacao, CalculadoraDeDistribuicaoDePilares, MonitorDeConsistencia, QualificadorDeLead, ConsultorDeBrandIntelligence.

## 8. Arquitetura dos Application Services

Um por caso de uso do SOFTWARE_SPEC: CapturarRegistroBruto, ClassificarRegistroBruto, AvaliarNovoCliente, RegistrarReuniao, PublicarBuildLog, CompletarCase, GerarConteudoAPartirDeCase, QualificarLead, AgendarReuniaoComercial, SincronizarDocumentoOficial, ExecutarAuditoriaTrimestral.

## 9. Arquitetura dos Repositórios

Um repositório por Aggregate Root (15, incluindo Lead e DocumentoOficial). Reference Data via repositórios de leitura simples. Sem ORM de mapeamento agressivo de agregados complexos.

## 10. Estratégia de Eventos

Eventos publicados in-process (sem message broker externo — ADR-002). Cada evento aciona listeners diretamente e opcionalmente grava em `event_log`.

## 11. Estratégia de Notificações

`MonitorDeConsistencia` roda periodicamente e gera `Alerta`. Entrega ao usuário é decisão de UI_UX.md.

## 12. Estratégia de Agendamento

Jobs: instanciação semanal da rotina fixa, verificação de ausência de BuildLog, disparo de auditoria trimestral, sincronização de documento_oficial, sincronização de agendamento_comercial. Scheduler simples (cron-like), não orquestrador complexo.

## 13. Estratégia para IA

Toda chamada de IA passa por uma porta (`PortaDeIA`) abstraindo provider/modelo. Toda chamada gera `SugestaoIA` com auditoria completa. Nenhuma chamada de IA escreve em Aggregate Root diretamente.

## 14. Estratégia de Auditoria

Três camadas: `event_log` (observabilidade geral), `case_historico`/`fundamento_historico` (versionamento onde é regra de negócio), `sugestao_ia` (auditoria de decisões de IA).

## 15. Estratégia de Segurança

Autenticação simples e forte para usuário único. Credenciais de integração armazenadas via secrets manager, nunca texto plano. Nenhum dado sensível de cliente exposto em `metadata`/`event_log.payload` sem necessidade.

## 16. Estratégia de Backup

Backup diário do banco relacional, retenção 30-90 dias. Documentos oficiais não precisam de backup próprio (Google Drive já é fonte de verdade); base indexada é recriável.

## 17. Estratégia Offline

Não é requisito.

## 18. Estratégia de Integrações

Padrão adaptador por integração externa. Falhas de integração externa nunca bloqueiam a captura na Inbox Universal.

## 19. Integração com Google Workspace

Google Calendar (agendamento_comercial), Google Drive (documento_oficial, fonte oficial), Gmail (entrada leve na Inbox, não CRM de e-mail completo).

## 20. Pipeline Comercial

Bounded Context que produz Cliente e Reuniao, mas não os possui — após conversão, responsabilidade passa ao contexto Clientes/Projetos, mantendo `lead_id` de origem.

## 21. Brand Intelligence

Google Drive → job de sincronização (hash) → chunking/embedding → `documento_chunk_indexado`. `ConsultorDeBrandIntelligence` injeta contexto em gerações de IA. Restrição de "não contrariar o Manual da Marca" é validação pós-geração, sinalizando divergência, nunca bloqueio automático absoluto.

## 22. Estrutura Completa de Pastas

Ver seção 3, detalhada por Bounded Context com subpastas domain/application/infrastructure.

## 23. ADRs

- **ADR-001:** Monolito modular, não microsserviços.
- **ADR-002:** Sem message broker externo; eventos in-process.
- **ADR-003:** `event_log` é observabilidade, explicitamente não Event Sourcing.
- **ADR-004:** Google Drive como fonte oficial de documentos de marca; base indexada é sempre cache derivado.
- **ADR-005:** IA nunca escreve diretamente em Aggregate Root de negócio.
- **ADR-006:** Lead e Cliente como entidades distintas, sem "promoção" de linha.
- **ADR-007:** Todo novo Bounded Context deve ser adicionável sem modificar os existentes — evolução por adição, nunca por acoplamento. Um novo contexto pode consumir eventos existentes, publicar eventos próprios, e invocar Application Services já existentes; nunca pode alterar a semântica de um evento existente, acessar diretamente tabelas de outro contexto, ou exigir que um Aggregate Root existente ganhe novo campo/estado/invariante só para acomodá-lo.

## 24. Riscos Arquiteturais

Dependência de disponibilidade do Google Workspace; custo/latência de IA crescendo com volume sem limite automático de gasto definido; chunking do Brand Intelligence podendo ficar desatualizado se sincronização falhar silenciosamente.

## 25. Trade-offs Assumidos

Integração polimórfica sem FK de banco (agilidade vs. integridade de aplicação); ausência de cache de peso_real de Pilar (simplicidade vs. custo de query); sincronização de Brand Intelligence por polling/webhook simples (pequena janela de desatualização aceitável).

## 26. O Que Foi Deliberadamente Deixado Fora

Multi-tenant, RBAC granular, multiusuário; message broker distribuído, event sourcing completo, CQRS; particionamento/sharding; offline-first; CRM financeiro completo; limite automático de gasto de IA (risco em aberto).

## 27. Arquitetura Evolutiva

Cinco futuros Bounded Contexts não implementados nesta versão: **Agents, Memory, Knowledge Graph, Capabilities, Missions.**

- **Agents:** agente de IA configurado para executar ações delimitadas, sempre gerando SugestaoIA, nunca escrita direta. Consome Application Services já existentes.
- **Memory:** memória de longo prazo reutilizável entre interações de IA, derivada de eventos já publicados (`sugestao.aceita`, `sugestao.rejeitada`). Sempre reconstruível, nunca fonte de verdade.
- **Knowledge Graph:** camada de leitura agregada sobre entidades existentes (relações semânticas). Projeção, nunca segunda fonte de verdade.
- **Capabilities:** catálogo declarativo de "coisas que o sistema/Agent sabe fazer" — cada Domain Service de IA já existente se torna, retroativamente, uma Capability registrada.
- **Missions:** orquestração de múltiplas etapas/contextos, sem eliminar pontos de confirmação humana já exigidos em cada etapa individual.

Princípio geral: nenhum desses contextos exige modificação de um contexto já congelado — todos entram por adição de eventos/Application Services (ADR-007).

## 27.7 — Por que a arquitetura atual já comporta esses contextos

Eventos como superfície pública (seção 10); IA nunca escreve diretamente em Aggregate Root (ADR-005); auditoria centralizada e genérica (`event_log`, `sugestao_ia`) já suficientemente flexível para acomodar novos tipos de ator sem alteração de schema.
