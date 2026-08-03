# ENGINEERING_MANIFEST.md
### SEPosicionaVictor — Manifesto de Engenharia (Versão Final)

## Fonte única de verdade

Ordem de precedência:
1. **SOM.md** — Sistema Operacional da Marca — Victor Sousa
2. **SOFTWARE_SPEC.md**
3. **DOMAIN_MODEL.md**
4. **DATABASE.md**
5. **ARCHITECTURE.md**
6. **UI_UX.md**
7. **INTERACTION_MODEL.md**
8. **INFORMATION_ARCHITECTURE.md**

Lista de precedência de produto/arquitetura encerrada em INFORMATION_ARCHITECTURE.md.

## Documentos de engenharia (não alteram precedência de produto/arquitetura)

- **IMPLEMENTATION_PLAN.md** — plano de execução.
- **CODING_GUIDELINES.md** — padrões de código.

## Documentos adiados para v2

AGENTS.md, AUTOMATIONS.md e ROADMAP.md — adiados para quando os Bounded Contexts da seção 27 do ARCHITECTURE.md forem implementados. DESIGN_SYSTEM.md não produzido nesta fase.

## Regras obrigatórias

- Nunca contradizer documentos anteriores na ordem de precedência.
- Nunca alterar arquitetura sem solicitação explícita.
- É proibido criar ou alterar Aggregate Roots dentro de Bounded Contexts congelados sem aprovação explícita.
- É permitido criar novos Aggregate Roots apenas dentro de novos Bounded Contexts aprovados formalmente, seguindo ADR-007, sem modificar os contextos existentes.
- Nunca alterar eventos existentes.
- Nunca criar novos módulos de interface sem justificativa rastreável ao critério da seção 5 do INFORMATION_ARCHITECTURE.md.
- IA nunca escreve diretamente em Aggregate Root (ADR-005).
- Todo novo Bounded Context deve seguir ADR-007.
- Em caso de conflito entre documentos, vence o documento mais alto na lista de precedência.

## Escopo de implementação desta fase

13 Bounded Contexts congelados (Sistema Operacional da Marca, Conhecimento, Reuniões, Agenda, Clientes, Projetos, Cases, Build Logs, Conteúdo, Registros Brutos/Inbox, Tarefas, Notificações, IA) + Pipeline Comercial + Brand Intelligence. Agents, Memory, Knowledge Graph, Capabilities e Missions não são implementados nesta fase.

## Objetivo

Construir exatamente o sistema descrito na documentação — nem mais, nem menos.
