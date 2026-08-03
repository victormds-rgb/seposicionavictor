# Conteúdo

**Status:** implementado na Sprint 6. Pilar e SerieFixa (Reference Data) povoados com os valores do SOM.

## Responsabilidade

Unidade de conteúdo publicável, com origem em Case, Build Log ou autônoma. Regra de derivação estritamente unidirecional (longo→curto, SOM Cap. 9.8) e distribuição de pilares editoriais (SOM Cap. 9.1), sempre calculada sob demanda, nunca armazenada (Decisão D6).

## Entidades

PecaDeConteudo (Aggregate Root); Pilar, SerieFixa (Reference Data)

## Sprint de implementação

Sprint 6 (IMPLEMENTATION_PLAN.md).

## Fonte da verdade

Ver `docs/DOMAIN_MODEL.md` e `docs/DATABASE.md` para o modelo completo, e `docs/ARCHITECTURE.md` (seção 4) para sua posição entre os Bounded Contexts do sistema.

## Decisões de engenharia registradas

- `tema_id` está nullable (divergência documentada do texto original do DATABASE.md) — Conhecimento (Sprint 7) ainda não populou `tema_mapeado`.
- Escala de "comprimento" de canal (proxy para a regra de derivação) completada com uma ordenação de 3 níveis, preenchendo lacuna do DATABASE.md original.
- `sugerirCanalPadrao()` em Cases (Sprint 5) permanece placeholder — ver AB-002, a ser resolvido quando Conhecimento (Sprint 7) também estiver pronto.
