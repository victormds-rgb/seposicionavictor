# IMPLEMENTATION_PLAN.md
### SEPosicionaVictor — Plano de Implementação

## 1. Filosofia de Implementação

Desenvolvimento incremental, em fatias verticais completas. Software funcionando acima de documentação adicional. Cada Sprint entrega valor utilizável. Evitar funcionalidades mortas. Construir verticalmente (interface + aplicação + domínio + persistência do mesmo módulo).

## 2. Princípios de Execução

Nunca iniciar dois módulos simultaneamente. Concluir um fluxo antes de iniciar outro. Toda Sprint termina com software executável. Nenhuma Sprint pode quebrar funcionalidades anteriores. Nenhuma Sprint altera decisões arquiteturais.

## 3. Roadmap Geral

| Sprint | Nome | Foco |
|---|---|---|
| 0 | Fundação | Ambiente, banco, CI/CD, autenticação |
| 1 | Shell | Layout, navegação, Dashboard vazio |
| 2 | Inbox Universal | Captura, classificação IA, persistência |
| 3 | Agenda | Reuniões, itens de agenda, rotina fixa |
| 4 | Pipeline Comercial | Leads, qualificação, conversão em Cliente |
| 5 | Projetos | Projetos, Critérios, Cases, Build Logs |
| 6 | Conteúdo | Biblioteca, planejamento, publicação |
| 7 | Conhecimento | Frameworks, Temas, Perguntas, Analogias |
| 8 | Brand Intelligence | Documentos, sincronização, indexação |
| 9 | IA | Sugestões, aprovação, auditoria, explicações |
| 10 | Hardening | Testes, performance, segurança, refatoração |

## 4. Detalhamento das Sprints

Cada Sprint contém: Objetivo, Funcionalidades, Dependências, Critérios de aceite, Riscos, Entregáveis — detalhados integralmente no histórico do projeto e reproduzidos de forma resumida abaixo.

**Sprint 0 — Fundação:** repositório, ambiente, CI/CD, autenticação simples, banco provisionado, migrations de Reference Data + fundamento, seed do Fundamento, observabilidade inicial. Critérios: compila/executa; CI roda testes; tabela fundamento existe e é legível com seed real; autenticação impede acesso não autorizado.

**Sprint 1 — Shell:** layout, navegação global, Dashboard inicial (estrutura de widgets), rotas conforme INFORMATION_ARCHITECTURE.md. Sem lógica de negócio.

**Sprint 2 — Inbox Universal:** captura em todos os tipos de entrada, Quick Capture, classificação assistida por IA, confirmação humana, persistência completa, busca/filtros.

**Sprint 3 — Agenda:** Reuniao completa, ItemDeAgenda com rotina semanal fixa, visualização de Agenda, notificações básicas.

**Sprint 4 — Pipeline Comercial:** Lead, Qualificação, Agendamento Comercial, conversão em Cliente via árvore de decisão do Cap. 7.1.

**Sprint 5 — Projetos:** Projeto completo, CriterioDeLancamento, Case completo com histórico, BuildLog completo.

**Sprint 6 — Conteúdo:** PecaDeConteudo completa, validação de derivação unidirecional, SerieFixa/Pilar povoados, cálculo de distribuição de pilares, fluxo rascunho→publicado.

**Sprint 7 — Conhecimento:** Framework, TemaMapeado, RegraDeDecisao povoados fielmente com o SOM Cap. 2; AtivoDeConhecimento; navegação de consulta.

**Sprint 8 — Brand Intelligence:** DocumentoOficial, DocumentoChunkIndexado, job de sincronização, ConsultorDeBrandIntelligence, interface de consulta.

**Sprint 9 — IA:** SugestaoIA com auditoria completa, AuditoriaDeDrift completa, explicações, painel de Alertas consolidado.

**Sprint 10 — Hardening:** cobertura de testes revisada, performance, segurança, logs/observabilidade, refatoração de débito técnico, documentação técnica.

## 5. Estratégia de Testes

Testar no momento da implementação de cada invariante, nunca adiado para o Sprint 10. Cobrir toda regra de negócio, invariante, fluxo de aprovação de IA, transição de estado de Aggregate Root. Critério mínimo de Sprint concluída: Critérios de Aceite atendidos + testes passando + nenhuma regressão + nenhuma violação do checklist do CODING_GUIDELINES.md.

## 6. Estratégia de Deploy

Local → Homologação (validação de Victor) → Produção. Migrações incrementais, uma por Sprint/necessidade de schema. Rollback sempre definido antes de aplicar em produção.

## 7. Definition of Done

Compila; executa; testes aprovados; documentação técnica complementar atualizada; sem violação do ENGINEERING_MANIFEST.md; sem violação do CODING_GUIDELINES.md; sem TODO crítico; sem débito técnico intencional não documentado.

## 8. Fora do Escopo

Agents, Memory, Knowledge Graph, Capabilities, Missions — pertencem à Arquitetura Evolutiva (ARCHITECTURE.md, seção 27), tratados em v2. Nenhuma Sprint antecipa estrutura para esses contextos.

## 9. Entrega para o Software Engineer

Seguir rigorosamente a sequência das Sprints. Nunca alterar arquitetura, domínio, ou UX. Interromper a implementação sempre que houver conflito entre documentação e código, reportando o conflito. Tratar toda decisão não documentada como dúvida arquitetural, nunca como liberdade de implementação.
