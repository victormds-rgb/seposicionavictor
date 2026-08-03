import { db } from "./client";
import { fundamento, pilar, serieFixa, framework, temaMapeado, temaFramework, ativoConhecimento, regraDecisao } from "./schema";
import { sql } from "drizzle-orm";

/**
 * Seed do banco — escopo acumulado até a Sprint 7.
 *
 * Sprint 0: Fundamento (Aggregate Root singleton), com o conteúdo
 * literal do SOM.md, Capítulo 1.
 *
 * Sprint 6: os 5 Pilares (Cap. 9.1) e as 4 Séries Fixas (Cap. 9.2).
 *
 * Sprint 7 (IMPLEMENTATION_PLAN.md — "Framework, TemaMapeado,
 * RegraDeDecisao como Reference Data, populados com o conteúdo exato
 * do SOM Cap. 2"): os 4 Frameworks, os 12 Temas Mapeados (ver nota de
 * governança em src/conhecimento/domain/tema-mapeado.ts sobre a
 * divergência "18 temas" vs. os 12 do SOM.md), as 2 Regras de
 * Decisão, e os 9 Ativos de Conhecimento (5 perguntas + 4 analogias).
 */

const PRINCIPIOS_OPERACIONAIS = [
  "Diagnóstico antes de ferramenta, sempre.",
  "Compromisso cumprido é inegociável — dos dois lados.",
  "A verdade desconfortável tem mais valor de marca do que a narrativa confortável.",
  "Prova pública substitui promessa.",
  "Recuo estratégico é permitido; desistência não.",
];

const NAO_E = [
  'Não é "especialista em IA" nem marca de ferramenta específica.',
  "Não é guru — não vende fórmula mágica nem resultado sem esforço do cliente.",
  "Não depende de termo emprestado de outro mercado (Forward Deployed Engineer foi inspiração técnica, não identidade).",
  "Não constrói autoridade em cima de opinião solta, só em cima de caso real, número real, diagnóstico real.",
];

const MANIFESTO = `Toda empresa que não cresce tem uma explicação pronta pra isso.
"O mercado está difícil." "Ainda não é o momento." "Já tentei e não funcionou." "É caro demais pra investir agora."

Quase nunca essa explicação é mentira por completo. Mas quase sempre ela é mais confortável do que a verdade.

Eu já vi um salão de beleza jurar que investir pouco era prudência — até perder dinheiro real com isso, insistir, e só sair do buraco quando parou de acreditar na própria desculpa. Vi um corretor jurar que o imóvel falava por si — até aparecer, falar, e vender mais do que nunca. Vi uma clínica pagar um ano inteiro por uma campanha que trouxe um único lead, porque trocar parecia mais arriscado do que continuar perdendo.

Eu também tive a minha. Contei durante anos que "abri, estruturei e vendi" três negócios. A verdade é que quebrei três negócios. Fui roubado dentro de um deles. Tive depressão. Recuei. Voltei a construir. A explicação confortável não era mentira — só era mais fácil de contar do que a verdade.

Meu trabalho não começa com uma ferramenta. Começa no momento em que alguém para de proteger a própria desculpa. Depois disso, quase qualquer solução decente já resolve.`;

async function seedFundamento() {
  const existing = await db.execute(
    sql`select id from fundamento where status = 'ativo' limit 1`
  );

  if (existing.length > 0) {
    console.log("Fundamento já existe (status = ativo). Seed não duplicado.");
    return;
  }

  await db.insert(fundamento).values({
    filosofia:
      "Nenhuma empresa deixa de crescer por falta de solução. Ela deixa de crescer porque está protegida atrás de uma explicação falsa e mais confortável do que a verdadeira. Enquanto essa explicação existir, nenhuma ferramenta funciona — nem a melhor do mundo. No momento em que ela cai, quase qualquer ferramenta decente já resolve.",
    bigIdea:
      "Toda empresa carrega uma mentira confortável sobre por que não está crescendo — e o crescimento começa exatamente no segundo em que ela para de acreditar nela.",
    fraseAncora: "Ninguém cresce enquanto acredita na própria desculpa.",
    manifesto: MANIFESTO,
    principiosOperacionais: PRINCIPIOS_OPERACIONAIS,
    naoE: NAO_E,
    status: "ativo",
    versao: 1,
  });

  console.log("Fundamento semeado com sucesso a partir do SOM.md, Capítulo 1.");
}

const PILARES_SOM = [
  { nome: "Diagnóstico de negócio (casos reais)", pesoAlvoPercentual: "30" },
  { nome: "Build in Public", pesoAlvoPercentual: "25" },
  { nome: "Análise crítica de tendência", pesoAlvoPercentual: "20" },
  { nome: "Bastidor pessoal / Quebra-Recuo-Volta", pesoAlvoPercentual: "15" },
  { nome: "Educação prática (frameworks)", pesoAlvoPercentual: "10" },
];

const SERIES_FIXAS_SOM = [
  { nome: "A Desculpa da Semana", diaSemanaPadrao: "segunda" },
  { nome: "Build Log Radar AI", diaSemanaPadrao: "terca" },
  { nome: "Ferramenta ou Sintoma?", diaSemanaPadrao: "quarta" },
  { nome: "Quebrei Isso Essa Semana", diaSemanaPadrao: "quinta" },
];

async function seedPilaresESeriesFixas() {
  const pilaresExistentes = await db.select().from(pilar).limit(1);
  if (pilaresExistentes.length === 0) {
    await db.insert(pilar).values(PILARES_SOM);
    console.log("5 Pilares semeados a partir do SOM.md, Capítulo 9.1.");
  } else {
    console.log("Pilares já existem. Seed não duplicado.");
  }

  const seriesExistentes = await db.select().from(serieFixa).limit(1);
  if (seriesExistentes.length === 0) {
    await db.insert(serieFixa).values(SERIES_FIXAS_SOM.map((s) => ({ ...s, status: "ativa" })));
    console.log("4 Séries Fixas semeadas a partir do SOM.md, Capítulo 9.2.");
  } else {
    console.log("Séries Fixas já existem. Seed não duplicado.");
  }
}

async function seedTudo() {
  await seedFundamento();
  await seedPilaresESeriesFixas();
  await seedConhecimento();
}

const FRAMEWORKS_SOM = [
  {
    nome: "Diagnóstico Antes da Ferramenta",
    estruturaEtapas: [
      "O que essa ferramenta promete resolver?",
      "Que problema ela resolve de verdade, versus que sintoma ela só disfarça?",
      "Que tipo de empresa vai usá-la pra evitar o problema real?",
      "Em que situação ela faz diferença só depois que a causa real já foi endereçada?",
    ],
    exemplosUso: "Aplicado a toda novidade técnica de IA/automação (SOM Cap. 2.5).",
  },
  {
    nome: "Régua da Desculpa",
    estruturaEtapas: [
      "Nível 1 — Desculpa de recurso (não tenho dinheiro/tempo/equipe)",
      "Nível 2 — Desculpa de mercado (o mercado mudou, a concorrência, o algoritmo)",
      "Nível 3 — Desculpa de identidade (não sou esse tipo de empresa/pessoa)",
    ],
    exemplosUso: "Aplicado a objeções de venda e problemas de equipe (SOM Cap. 2.5).",
  },
  {
    nome: "Quebra, Recuo, Volta",
    estruturaEtapas: [
      "Quebra: o que deu errado de fato, sem edição",
      "Recuo: o que foi feito no período de reorganização",
      "Volta: o que ficou diferente na volta",
    ],
    exemplosUso: "Aplicado a bastidores, erros e construção de produto (SOM Cap. 2.5).",
  },
  {
    nome: "Coringa vs. Sob Medida",
    estruturaEtapas: [
      'Ferramenta genérica ("coringa"): CRM, chatbot, dashboard',
      "Aplicação sob medida: só funciona após diagnóstico certo",
    ],
    exemplosUso: "Aplicado a automação (SOM Cap. 2.5).",
  },
];

// 12 temas literais do SOM.md, Capítulo 2.5 — ver nota de governança
// em src/conhecimento/domain/tema-mapeado.ts sobre a divergência com
// a menção a "18 temas" em outros documentos.
const TEMAS_COM_FRAMEWORKS_SOM: Array<{ nomeTema: string; frameworks: string[] }> = [
  { nomeTema: "IA", frameworks: ["Diagnóstico Antes da Ferramenta"] },
  { nomeTema: "Automação", frameworks: ["Coringa vs. Sob Medida"] },
  { nomeTema: "Vendas", frameworks: ["Régua da Desculpa"] },
  { nomeTema: "Gestão/Liderança", frameworks: ["Régua da Desculpa"] },
  { nomeTema: "Produtividade", frameworks: ["Diagnóstico Antes da Ferramenta"] },
  { nomeTema: "Construção de produto", frameworks: ["Quebra, Recuo, Volta"] },
  { nomeTema: "Empreendedorismo", frameworks: ["Quebra, Recuo, Volta"] },
  { nomeTema: "Estudos/Aprendizado", frameworks: [] },
  { nomeTema: "Bastidores/Build in Public", frameworks: ["Quebra, Recuo, Volta"] },
  { nomeTema: "Tendências de mercado", frameworks: ["Diagnóstico Antes da Ferramenta", "Régua da Desculpa"] },
  { nomeTema: "Casos reais de clientes", frameworks: ["Régua da Desculpa"] },
  { nomeTema: "Erros", frameworks: ["Quebra, Recuo, Volta"] },
];

const PERGUNTAS_RECORRENTES_SOM = [
  "Isso resolve o problema, ou só torna o problema mais confortável de carregar?",
  "Quem se beneficia de continuar acreditando que esse é o problema real?",
  "Se essa ferramenta/técnica sumisse amanhã, o que mudaria de verdade?",
  "Essa explicação seria a mesma se não custasse nada admitir a real?",
  "O que essa pessoa/empresa está evitando olhar de frente?",
];

const ANALOGIAS_SOM = [
  "A pedra no caminho (o obstáculo real, geralmente invisível)",
  "O vídeo feio que virou campanha boa (o material já estava lá, faltava aplicação)",
  "Cafeteria incrível, gerente errado (negócio bom que quebra por falta de sistema de confiança)",
  "Investir pouco por medo de perder é o jeito mais caro de perder",
];

const REGRAS_DE_DECISAO_SOM = [
  {
    nome: "Aceitar ou Recusar Cliente",
    aplicaA: "cliente",
    estruturaArvore: {
      pergunta1: "Cliente tem autoridade/competência real no próprio setor?",
      seNao1: "aceitar apenas se o caixa exigir, sinalizado como 'cliente de caixa'",
      pergunta2: "Cliente aceita ouvir diagnóstico antes de exigir execução imediata?",
      seNao2: "aceitar só se necessário para caixa, com atrito esperado",
      pergunta3: "Existe sinal de não cumprimento de combinado (histórico/indicação)?",
      seSim3: "exigir contrato formal e pagamento adiantado",
      seNao3: "processo padrão",
      seSim1eSim2eNao3: "prioridade alta",
    },
  },
  {
    nome: "Framework sem Case",
    aplicaA: "conteudo_sem_case",
    estruturaArvore: {
      pergunta1: "Tenho case pessoal ou de cliente sobre o assunto?",
      seSim1: "use Prova e Portfólio (Capítulo 5)",
      pergunta2: "É tendência/notícia/tema de terceiros?",
      seSim2: "aplique Framework 1 ou 2 como lente crítica",
      pergunta3: "É reflexão pessoal/aprendizado em andamento?",
      seSim3: "use Quebra-Recuo-Volta ou Perguntas Recorrentes",
      seNao3: "não publique ainda — falta ângulo próprio",
    },
  },
];

async function seedConhecimento() {
  const frameworksExistentes = await db.select().from(framework).limit(1);
  if (frameworksExistentes.length > 0) {
    console.log("Conhecimento já semeado. Seed não duplicado.");
    return;
  }

  const frameworksInseridos = await db
    .insert(framework)
    .values(FRAMEWORKS_SOM.map((f) => ({ ...f, status: "ativo" })))
    .returning();
  console.log(`${frameworksInseridos.length} Frameworks semeados a partir do SOM.md, Capítulo 2.2.`);

  const mapaNomeParaId = new Map(frameworksInseridos.map((f) => [f.nome, f.id]));

  const temasInseridos = await db
    .insert(temaMapeado)
    .values(TEMAS_COM_FRAMEWORKS_SOM.map((t) => ({ nomeTema: t.nomeTema })))
    .returning();
  console.log(
    `${temasInseridos.length} Temas Mapeados semeados a partir do SOM.md, Capítulo 2.5 (12 temas literais do documento).`
  );

  const relacoes = temasInseridos.flatMap((temaRow) => {
    const tema = TEMAS_COM_FRAMEWORKS_SOM.find((t) => t.nomeTema === temaRow.nomeTema);
    return (tema?.frameworks ?? []).map((nomeFramework) => ({
      temaId: temaRow.id,
      frameworkId: mapaNomeParaId.get(nomeFramework)!,
    }));
  });
  if (relacoes.length > 0) {
    await db.insert(temaFramework).values(relacoes);
    console.log(`${relacoes.length} relações tema↔framework semeadas.`);
  }

  await db.insert(regraDecisao).values(REGRAS_DE_DECISAO_SOM);
  console.log("2 Regras de Decisão semeadas (Cap. 7.1 e Cap. 2.6).");

  await db.insert(ativoConhecimento).values([
    ...PERGUNTAS_RECORRENTES_SOM.map((texto) => ({
      tipo: "pergunta_recorrente",
      conteudoTextual: texto,
      status: "ativo",
    })),
    ...ANALOGIAS_SOM.map((texto) => ({
      tipo: "analogia",
      conteudoTextual: texto,
      status: "ativo",
    })),
  ]);
  console.log("9 Ativos de Conhecimento semeados (5 perguntas + 4 analogias, SOM Cap. 2.3/2.4).");
}

seedTudo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Falha ao semear o banco:", error);
    process.exit(1);
  });
