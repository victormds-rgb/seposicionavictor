// Ponto único de exportação do schema — usado pelo cliente Drizzle
// e pelo drizzle-kit.
//
// FONTE DA VERDADE: docs/DATABASE.md.
// Este arquivo (e os demais em infra/persistence/db/schema/) é
// exclusivamente a IMPLEMENTAÇÃO EM DRIZZLE ORM do que já está
// especificado em docs/DATABASE.md — nunca o contrário. Nenhuma
// tabela, coluna, enum ou índice deve existir aqui sem estar
// primeiro descrito em DATABASE.md; e nenhuma alteração de schema
// de negócio deve ser feita editando apenas este arquivo — ela
// precisa primeiro ser refletida (ou já estar refletida) no
// documento congelado, conforme ENGINEERING_MANIFEST.md.
//
// Nesta fase (Sprint 0-9), as tabelas de Reference Data, Fundamento,
// event_log, Inbox Universal, IA, Reuniões, Agenda, Pipeline
// Comercial, Clientes, Projetos, Cases, Build Logs, Conteúdo,
// Conhecimento, Brand Intelligence e Notificações são exportadas.
export * from "./conhecimento";
export * from "./fundamento";
export * from "./event_log";
export * from "./reuniao";
export * from "./inbox";
export * from "./ia";
export * from "./item-agenda";
export * from "./pipeline-comercial";
export * from "./cliente";
export * from "./projeto";
export * from "./case";
export * from "./build-log";
export * from "./peca-conteudo";
export * from "./ativo-conhecimento";
export * from "./brand-intelligence";
export * from "./notificacoes";
