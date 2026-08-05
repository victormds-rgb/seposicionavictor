# Guia de Operação Diária

Como usar o SEPosicionaVictor no dia a dia — da abertura ao fechamento.
Este guia é operacional (produto), não técnico — para instalação/deploy
ver [`README.md`](README.md) e [`DEPLOY_VERCEL.md`](DEPLOY_VERCEL.md).

A ordem abaixo segue a lógica do próprio sistema: o Dashboard existe
justamente para ser o primeiro lugar que você olha, e a rotina semanal
fixa (SOM Cap. 9.4) já dita o que fazer em cada dia da semana — este
guia só amarra as duas coisas numa sequência prática.

---

## Abertura do dia (5–10 min)

**Tela: Dashboard** (`/dashboard`, ou "/" — é para onde tudo redireciona).

1. **Agenda do dia** — veja o que está marcado para hoje. Se algo já
   passou do horário e ainda mostra `agendado`, é porque o Job
   `atualizar-itens-vencidos` ainda não rodou hoje (ver
   [`DAILY_CHECKLIST.md`](DAILY_CHECKLIST.md)) — não é a aplicação
   travada.
2. **Alertas ativos** — olhe antes de qualquer outra coisa. Um Alerta de
   `build_log_ausente` ou `desvio_pilares` muda o que você prioriza no
   resto do dia (ver seção "Decisões do dia" abaixo).
3. **Pendências da Inbox** — quantos registros aguardam sua revisão de
   sugestão de IA. Se o número está alto (mais de ~10), reserve um bloco
   maior de tempo antes de continuar (ver Inbox abaixo).
4. **Distribuição de Pilares** — olhar rápido, decisão só na
   Sexta-feira (revisão semanal) ou se um `desvio_pilares` apareceu nos
   Alertas.

**Decisão de abertura:** se há Alertas ativos que exigem ação humana
(`desvio_pilares`, `auditoria_devida`) ou pendências grandes na Inbox,
trate isso **antes** de seguir para a rotina do dia da semana. Alertas de
`build_log_ausente` não pedem ação imediata — eles só se resolvem
publicando um Build Log de verdade (ver Terça-feira abaixo).

---

## Durante o dia — captura contínua (sem tempo fixo)

**Não é uma tela — é um hábito.** Sempre que algo acontecer (uma ideia,
uma decisão em reunião, um aprendizado, um print, um áudio), capture na
hora com o atalho **`Q`** (Quick Capture, disponível em qualquer tela) ou
pela seção "Capturar" da própria Inbox. Nunca decida na hora da captura
"isso é o quê" — a IA sugere um destino depois, você confirma quando
tiver tempo. Isso é o ponto central do sistema: nunca perder informação
por estar "no meio de outra coisa".

---

## Rotina semanal fixa — o que fazer em cada dia (SOM Cap. 9.4)

A Agenda (`/agenda`) tem um botão **"Instanciar rotina desta semana"** —
clique nele na segunda-feira de manhã (ou quando abrir o sistema pela
primeira vez na semana) para colocar os 5 blocos abaixo na Agenda. É
idempotente: clicar de novo na mesma semana não duplica nada.

| Dia | O que fazer | Onde |
|---|---|---|
| **Segunda** | Revisar a semana anterior e escolher um caso/tendência para "A Desculpa da Semana" | Conhecimento (framework Régua da Desculpa) → Conteúdo |
| **Terça** | Gravar/escrever o Build Log do produto | Projetos → projeto tipo "Produto próprio" → Build Log |
| **Quarta** | Produzir a análise crítica da semana (Framework 1 — Diagnóstico Antes da Ferramenta) | Conteúdo → Nova Peça, pilar "Análise crítica de tendência" |
| **Quinta** | Bastidor/erro da semana (Quebra, Recuo, Volta) | Conteúdo → Nova Peça, pilar "Bastidor pessoal" |
| **Sexta** | Revisão da semana + agendar a semana seguinte + responder comentários | Agenda (agendar reuniões da próxima semana) + Dashboard (conferir Distribuição de Pilares) |

Marque cada bloco como concluído na Agenda (`Marcar como concluído`)
assim que terminar — é o que mantém a visão semanal honesta.

**Toda semana, 3 fontes obrigatórias de ideia** (SOM Cap. 9.6), capturadas
via Quick Capture assim que acontecerem, não esperadas até sexta:
1. Uma conversa real com cliente/lead.
2. Uma decisão real tomada num dos produtos próprios (Radar AI, Albatroz OS).
3. Uma notícia/tendência do setor.

---

## Fluxo comercial (quando houver Lead novo)

Não tem dia fixo — acontece quando surge. Sequência completa em
[`CLIENT_ONBOARDING.md`](CLIENT_ONBOARDING.md). Resumo: **Pipeline
Comercial** → qualificar → agendar → (marcar reunião como realizada na
**Agenda**) → confirmar reunião no Pipeline → converter em **Cliente** →
criar **Projeto**.

---

## Inbox — quando processar

Não deixe pendências de sugestão de IA se acumularem por mais de 1 dia.
Cada item mostra `IA sugere: <tipo> — <justificativa> (confiança: X)`.
Três decisões possíveis, sempre humanas:

- **Aceitar** — a sugestão está certa, um gesto e pronto.
- **Editar e confirmar** — a IA errou o destino, você escolhe o certo
  (projeto, build_log, peça_conteudo, tarefa, ativo_conhecimento).
- **Rejeitar** — não serve para nada agora; fica descartado, sem destino.

Reunião realizada gera automaticamente um convite para capturar as notas
na Inbox — não pule esse passo, é o que fecha o ciclo Agenda → Inbox →
Reunião processada.

---

## Fechamento do dia (5 min)

1. Volte ao **Dashboard** — confirme que não sobrou Alerta ativo que
   você deveria ter tratado.
2. Confirme que a Inbox não tem pendência esquecida de hoje.
3. Se é sexta-feira, faça a revisão semanal (ver tabela acima) antes de
   fechar.

---

## Tempo estimado por dia

| Bloco | Tempo |
|---|---|
| Abertura (Dashboard + Alertas + Inbox) | 5–10 min |
| Bloco da rotina semanal fixa do dia | 30–60 min (varia por dia — Build Log e análise crítica tendem a levar mais que os outros) |
| Processar Inbox ao longo do dia | 10–15 min, em pequenos blocos |
| Fechamento | 5 min |
| **Total num dia sem Lead novo** | **~1h a 1h30** |

Dias com um Lead avançando no Pipeline ou uma reunião real somam tempo
variável, fora deste cálculo — não são rotina, são trabalho comercial/
executivo direto.
