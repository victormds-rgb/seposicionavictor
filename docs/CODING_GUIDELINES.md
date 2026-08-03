# CODING_GUIDELINES.md
### SEPosicionaVictor — Padrões Obrigatórios de Implementação

## 1. Filosofia de Código

Clareza acima de esperteza. Código explícito. Legibilidade. Simplicidade. Baixo acoplamento. Alta coesão. Refatoração contínua.

## 2. Estrutura do Projeto

Domain (regras puras, sem dependência de outra camada), Application (orquestra, sem regra própria), Infrastructure (implementa interfaces, nunca define regra de negócio), Presentation (depende de Application), Shared (exceção, não regra). Dependência: Presentation → Application → Domain ← Infrastructure.

## 3. Convenções

Arquivos nomeados fielmente à terminologia do DOMAIN_MODEL.md. Nomes consistentes por Bounded Context. Classes: substantivo. Interfaces (portas): capacidade oferecida, não implementação. Funções: verbo infinitivo exato. Constantes: maiúsculas + underscore, com referência ao capítulo de origem. Enums: espelham exatamente os estados do DOMAIN_MODEL.md. Eventos: `entidade.acao_no_passado`, exatamente os 21 catalogados. DTOs por direção/propósito. Repositories: um por Aggregate Root.

## 4. Domain Rules

Aggregate Root como ponto único de entrada de modificação. Entity com identidade própria dentro da fronteira do agregado. Value Object imutável, comparado por valor. Domain Events publicados após mudança de estado válida.

Proibições: lógica de negócio em controllers; lógica de negócio em repositories; acesso direto ao banco pelo frontend.

## 5. Application Layer

Use Cases: um por ação relevante do SOFTWARE_SPEC. Commands (intenção de mudança). Queries (intenção de leitura, nunca alteram estado). DTOs na fronteira Application↔Presentation. Validação de formato na Application; validação de regra de negócio no Domain.

## 6. Infrastructure

Banco, APIs externas (atrás de porta), Storage, Cache (só com necessidade real observada), Queue (job simples, não fila distribuída). Nunca contém regra de negócio.

## 7. Frontend

Componentes por módulo/aba/detalhe (INFORMATION_ARCHITECTURE.md, seção 5). Hooks encapsulam lógica de apresentação, nunca regra de domínio. Rotas seguem as URLs conceituais. Estado de UI na Presentation; estado de domínio sempre via Query da Application. Validação de formulário no frontend é feedback imediato, nunca a única validação.

## 8. Tratamento de Erros

Domain lança exceções de violação de invariante. Logs com contexto suficiente. Mensagens ao usuário curtas e diretas; stack trace nunca exposto diretamente. Retry só para falhas transitórias de integração externa.

## 9. Testes

Unitários: Domain (Aggregate Roots, Value Objects, Domain Services, Policies) — toda invariante tem teste. Integração: Application Services + Infrastructure real/fiel. E2E: fluxos críticos da Jornada Diária. Não testar: estilo visual, bibliotecas de terceiros já testadas.

## 10. Performance

Otimizar só quando houver necessidade observada, nunca preventivamente.

## 11. Segurança

Autenticação simples e forte para usuário único. Credenciais nunca em texto plano. Nenhum dado sensível em log/metadata sem necessidade.

## 12. Observabilidade

Logs técnicos separados de `event_log` (observabilidade de domínio). Tracing via `correlation_id`. Métricas: volume por contexto, taxa de aceitação/rejeição de IA, frequência de Build Log.

## 13. Revisão de Código (checklist de PR)

- [ ] Camada correta (Domain/Application/Infrastructure/Presentation)?
- [ ] Nenhuma regra de negócio fora do Domain?
- [ ] Nenhum Aggregate Root novo em contexto congelado sem aprovação?
- [ ] Nenhum evento existente alterado?
- [ ] Nomenclatura idêntica à dos documentos congelados?
- [ ] Nenhuma regra nova inventada durante a implementação?
- [ ] Testes cobrem as invariantes tocadas?
- [ ] Nenhuma dependência circular?
- [ ] Nenhum acesso a banco fora de Infrastructure?
- [ ] IA apenas sugere, nunca escreve diretamente em Aggregate Root?

## 14. Regras Absolutas

Nunca: quebrar arquitetura; quebrar domínio; criar Aggregate Root em contexto congelado sem aprovação; alterar semântica/nome/payload de evento; criar dependência circular; acessar banco fora de Infrastructure; permitir IA escrever diretamente em Aggregate Root (ADR-005); introduzir novo Bounded Context sem seguir ADR-007.
