# Sistema Operacional da Marca (Fundamento)

**Status:** implementado como leitura — schema, seed, Domain e
Infrastructure de leitura já existem e estão em uso ativo (Sprint 9). Não
é mais um Bounded Context reservado, mas continua **deliberadamente sem
nenhum Use Case de escrita** — ver "Por que não há escrita" abaixo.

## Responsabilidade

Guardar o Fundamento — a constituição da marca (filosofia, Big Idea,
frase-âncora, manifesto, princípios operacionais, "o que a marca não é").

## O que existe

- `domain/fundamento.ts` — `Fundamento` (Aggregate Root) e
  `FundamentoRepository` (interface **só leitura**: `buscarAtivo()`).
- `infrastructure/fundamento-repository.ts` — `DrizzleFundamentoRepository`,
  implementação real de `buscarAtivo()`.
- `application/` — vazio (só `.gitkeep`); não há Use Case: o único
  consumidor real hoje é `AuditoriaDeDrift`
  (`src/notificacoes/application/monitor-de-consistencia.ts`), que lê
  `fraseAncora` diretamente via o repositório para o checklist
  automatizável (SOM Cap. 2.7).

## Por que não há escrita

A edição do Fundamento é, por decisão de domínio explícita (documentada
no próprio `domain/fundamento.ts`), uma **ação humana direta e
deliberada** (SOM Cap. 8.3: "Filosofia e posicionamento só voltam à mesa
se uma contradição grave aparecer entre prática e Fundamento") — não um
fluxo de edição rotineiro pela aplicação. Não existe, hoje, nenhum Use
Case, Server Action ou tela para editar o Fundamento.

Consequência direta: a tabela `fundamento_historico` (schema em
`infra/persistence/db/schema/fundamento.ts`, aplicada via migration)
**existe mas nunca é escrita** — não há nenhum ponto no código que a
alimente, porque não existe nenhum fluxo de edição mediado pela aplicação
para gerar um snapshot. Isso não é uma lacuna acidental: implementar a
escrita exigiria primeiro decidir se a edição do Fundamento passa a ser
uma operação mediada pela aplicação (um novo Use Case) — decisão de
arquitetura fora do escopo de manutenção, registrada aqui para quem for
avaliar essa mudança no futuro.

## Entidades

Fundamento (Aggregate Root), fundamento_historico (Entity de histórico —
schema pronto, sem escritor).

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo
desta entidade/contexto, e `docs/ARCHITECTURE.md` (seção 4) para sua
posição entre os Bounded Contexts do sistema.
