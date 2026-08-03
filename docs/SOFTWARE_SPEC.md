# SOFTWARE_SPEC.md

## 1. Propósito do Sistema

Software pessoal, uso exclusivo de Victor Sousa, que opera como camada de execução do Sistema Operacional da Marca (SOM). O SOM define *o que* é verdade sobre a marca (filosofia, voz, regras de decisão); este software define *como* essas regras são aplicadas no dia a dia — reduzindo carga mental de lembrar checklists, prazos e critérios manualmente.

**Não é** uma ferramenta de marca pessoal para terceiros, nem um produto comercial (não confundir com Radar AI ou Albatroz OS, que são produtos separados de Victor — este sistema pode eventualmente gerenciar o conteúdo *sobre* esses produtos, mas não é o mesmo software).

## 2. Persona única

Um usuário: Victor Sousa. Não há multi-tenant, não há papéis de permissão, não há colaboração multiusuário nesta versão (ver ROADMAP.md para evolução futura com equipe, mencionada no SOM Cap. 9, Evolução Futura).

## 3. Objetivos funcionais (rastreados ao SOM)

| # | Objetivo (linguagem do usuário) | Capítulo(s) do SOM de origem |
|---|---|---|
| O1 | Saber o que fazer na semana | Cap. 9.4 (Rotina Semanal), 9.5 (Rotina Mensal) |
| O2 | Receber alertas e notificações | Cap. 8.1 (Sinais de Drift), 4.5 (Frequência mínima), 7.1 (regras de cliente) |
| O3 | Organizar clientes, projetos e conteúdo | Cap. 5 (Prova e Portfólio), 7.1/7.2/7.3 (Regras de Decisão) |
| O4 | Transformar reuniões e aprendizados em tarefas e cases | Cap. 4.4 (Build Log), 5.1 (Formato de Case), 9.10 (Integração conteúdo-produto) |
| O5 | Priorizar o que importa | Cap. 9.1 (Pilares e %), 7.1/7.2 (Árvores de decisão) |
| O6 | Reduzir carga mental | Todo o sistema — este é o objetivo transversal, não uma feature isolada |

Cada requisito funcional na seção 5 mapeia para um ou mais desses objetivos.

## 4. Fora de escopo (explícito)

- Multiusuário, permissões, colaboração em tempo real.
- Publicação automática em redes sociais (o sistema organiza e prepara conteúdo; publicar é decisão e ação manual de Victor, compatível com SOM Cap. 3 — voz não pode ser automatizada sem revisão).
- Geração de conteúdo final sem revisão humana — o SOM (Cap. 3.6, Cap. 9.9) exige resposta pessoal, não automatizada, a comentários e críticas. O sistema pode *sugerir* rascunho via IA, nunca publicar sozinho.
- CRM completo de vendas (contratos, faturamento, cobrança) — este sistema referencia clientes e projetos para fins de conteúdo/priorização, não é sistema financeiro. Justificativa: o SOM não define regras de negócio financeiras, apenas critérios de aceite/recusa de cliente (Cap. 7.1) e formato de case (Cap. 5.1) — o software implementa isso, não um ERP.

## 5. Requisitos Funcionais

Nomenclatura: RF-[Capítulo do SOM].[sequencial]

### RF-1.x — Fundamento (Cap. 1)
- **RF-1.1**: O sistema deve armazenar o Fundamento (filosofia, Big Idea, frase-âncora, manifesto, 5 princípios operacionais, seção "o que a marca não é") como registro versionado e imutável por padrão — só editável por ação explícita, nunca por sugestão automática de IA (SOM 8.3: filosofia só é reaberta em caso de contradição grave, decisão humana).
- **RF-1.2**: Toda entidade de conteúdo (RF-2.x) deve poder ser avaliada contra o checklist de 6 itens do Cap. 1 antes de publicação — ver seção 8 (Eventos) para o fluxo de validação.

*Justificativa de não-implementação automática de bloqueio*: o checklist do SOM é uma ferramenta de reflexão do próprio Victor, não uma regra de negação automática — o sistema **sinaliza**, não **impede** publicação. Bloquear composição unilateralmente contradiz a autonomia editorial implícita em todo o SOM (Victor sempre decide, o sistema assiste).

### RF-2.x — Conteúdo (Cap. 2, 3, 9)
- **RF-2.1**: Cadastro de peça de conteúdo com campos: tema (um dos 18 listados no SOM), framework aplicado (Diagnóstico-Antes-da-Ferramenta / Régua da Desculpa / Quebra-Recuo-Volta / Coringa-vs-Sob-Medida — Cap. 2.2), canal (LinkedIn/Instagram/X/YouTube/Newsletter — Cap. 3.7, 9.3), série fixa associada se aplicável (Cap. 9.2), status (rascunho/revisão/agendado/publicado).
- **RF-2.2**: O sistema deve sugerir, para qualquer tema sem case pessoal associado, qual framework aplicar, seguindo a árvore de decisão do Cap. 2.6.
- **RF-2.3**: Registro de reaproveitamento — toda peça longa (newsletter, vídeo) deve poder gerar peças derivadas com relação de origem rastreada (Cap. 9.8: fluxo unidirecional longo→curto, nunca o inverso). O sistema deve impedir (validação de dados, não apenas alerta) a criação de uma relação de derivação curto→longo, pois isso viola uma regra estrutural explícita do SOM, não uma preferência.

### RF-3.x — Clientes e Projetos (Cap. 5, 7)
- **RF-3.1**: Cadastro de cliente/projeto com os 6 campos obrigatórios do formato de case (Cap. 5.1): desculpa, custo mensal, momento da quebra, solução, tempo, número de resultado. Campos "momento da quebra", "solução", "tempo" e "número" podem ficar em branco até o projeto avançar — mas "desculpa" e "custo mensal" são obrigatórios **no cadastro inicial** (Cap. 5.3: "desde o dia 1, registrar a desculpa inicial e o custo mensal").
- **RF-3.2**: Ao cadastrar um cliente/lead, o sistema conduz Victor pela árvore de decisão do Cap. 7.1 (autoridade real no setor → aceita diagnóstico antes de execução → sinal de não-cumprimento de combinado) e registra o resultado como classificação do cliente: "prioridade alta", "cliente de caixa", "exigir contrato reforçado".
- **RF-3.3**: Projetos de produto (Radar AI, Albatroz OS, futuros) são uma entidade separada de "cliente", mas compartilham o relacionamento com conteúdo (Build Log, Cap. 4) e com a regra de lançamento do Cap. 7.2 (critério "ficou muito bom, vai ajudar" antes de publicar feature).

### RF-4.x — Reuniões e Aprendizados → Tarefas/Conteúdo (Cap. 4, 9.10)
- **RF-4.1**: Entrada de "registro bruto" (texto livre — resumo de reunião, aprendizado, decisão) que o sistema classifica, com confirmação humana, em um dos três destinos definidos no Cap. 9: (a) case (Cap. 5), (b) Build Log de produto (Cap. 4), (c) bastidor Quebra-Recuo-Volta (Cap. 2, Framework 3). Classificação é sugestão de IA; confirmação final é sempre de Victor (mesmo princípio de RF-1.2).
- **RF-4.2**: Toda entrada classificada como "reunião com cliente" pode gerar automaticamente: (i) uma tarefa de follow-up, (ii) um rascunho de atualização nos campos do case correspondente (RF-3.1).

### RF-5.x — Priorização (Cap. 7, 9.1)
- **RF-5.1**: Dashboard semanal que aplica a distribuição de pilares do Cap. 9.1 (30% diagnóstico, 25% build in public, 20% análise crítica, 15% bastidor, 10% educação) como meta de balanceamento — o sistema mostra o desvio real vs. meta, não impõe.
- **RF-5.2**: Fila de decisão de clientes pendentes (RF-3.2) priorizada por: (1) alinhamento com Cap. 7.1 (autoridade real + aceita diagnóstico), (2) urgência de caixa (dado externo, input manual de Victor, já que o SOM não define isso — situação financeira é contexto de negócio, não regra de produto).

### RF-6.x — Alertas (Cap. 4.5, 8.1, 8.2)
- **RF-6.1**: Alerta quando não há Build Log publicado há mais de 2-3 semanas (Cap. 8.1 — sinal explícito de drift).
- **RF-6.2**: Alerta trimestral automático para rodar a auditoria de drift do Cap. 8.2 (revisar últimos 20 conteúdos contra Cap. 1.8/2.7).
- **RF-6.3**: Alerta quando volume de conteúdo publicado nas últimas semanas se desvia da distribuição de pilares (RF-5.1) além de um limiar configurável (o SOM não define limiar numérico para isso — apenas para a auditoria de drift geral, que é 30%, Cap. 8.2. Usar o mesmo limiar de 30% por consistência, mas sinalizar como decisão de engenharia, não regra do SOM).

## 6. Requisitos Não-Funcionais

- **Uso pessoal / single-user**: sem necessidade de autenticação multiusuário robusta; autenticação simples é suficiente (justificativa: escopo de Persona única, seção 2).
- **Offline-first não é requisito** — Victor não mencionou necessidade de uso desconectado; assume-se conectividade padrão de uso móvel/desktop.
- **Baixa manutenção**: dado que Victor não é desenvolvedor profissional (Fundamento SOM, Cap. 1.1) e está construindo isso sozinho ou com equipe mínima, a arquitetura (ver ARCHITECTURE.md) deve priorizar simplicidade operacional sobre escalabilidade — não há requisito de multi-tenant nem de alta concorrência.
- **Auditabilidade de dados de case**: os 6 campos do formato de case (Cap. 5.1) precisam de histórico de edição, pois são usados como prova pública (Cap. 1.7, princípio 4: "prova pública substitui promessa") — dado incorreto ou alterado sem rastro compromete a credibilidade que é ativo central da marca.

## 7. Entradas e Saídas do Sistema (visão de alto nível)

**Entradas:**
- Texto livre (registro de reunião, aprendizado, ideia) — RF-4.1
- Dados estruturados de cliente/projeto — RF-3.1, RF-3.2
- Confirmações/decisões humanas sobre sugestões da IA — presente em RF-1.2, RF-4.1

**Saídas:**
- Tarefas (com prazo, origem rastreada)
- Rascunhos de conteúdo (não publicados automaticamente — seção 4, Fora de Escopo)
- Alertas/notificações (RF-6.x)
- Dashboard de priorização semanal (RF-5.1)
- Cases estruturados prontos para publicação (RF-3.1 → RF-2.1)

## 8. Eventos principais do sistema

| Evento | Disparado por | Efeito |
|---|---|---|
| `registro_bruto.criado` | RF-4.1 | Sistema sugere classificação (case / build log / bastidor) |
| `case.campo_obrigatorio_ausente` | RF-3.1 | Bloqueia case como "publicável", mantém como rascunho |
| `cliente.avaliado` | RF-3.2 | Gera classificação de prioridade/risco |
| `conteudo.checklist_solicitado` | RF-1.2 | Sistema retorna avaliação contra os 6 itens do Cap. 1, não bloqueia |
| `derivacao.invalida_detectada` | RF-2.3 | Bloqueia (validação dura) tentativa de relação curto→longo |
| `build_log.ausente_2_semanas` | RF-6.1 | Notificação |
| `trimestre.auditoria_devida` | RF-6.2 | Notificação com link para os últimos 20 conteúdos |
| `pilares.desvio_detectado` | RF-6.3 | Notificação com comparação meta vs. real |

## 9. Dependências entre requisitos

- RF-4.1 depende de RF-2.1, RF-3.1 e Framework do Cap. 2.2 já estarem modelados (não é possível classificar destino sem essas entidades existirem).
- RF-5.1 depende de histórico de conteúdo publicado (RF-2.1 com status "publicado") acumulado.
- RF-6.2 depende de RF-2.1 (para existir o que auditar).
- RF-3.3 depende de RF-3.1 (schema de projeto de produto reutiliza conceito de case, mas não é obrigado a ter todos os 6 campos preenchidos — produto interno, não cliente externo).

## 10. Decisões de escopo que exigiram interpretação (explicitadas, não regras novas)

1. **Bloqueio vs. alerta (RF-1.2, RF-2.3)**: o SOM nunca define se os checklists são bloqueantes. Escolhido "alerta, não bloqueio" para tudo relacionado a julgamento editorial (Cap. 1, 2), e "bloqueio duro" apenas para a regra estrutural explícita do Cap. 9.8 (fluxo unidirecional de reaproveitamento), porque essa é a única regra do SOM formulada como proibição categórica ("nunca o inverso"), não como princípio de reflexão.
2. **Limiar de desvio de pilares (RF-6.3)**: o SOM define 30% só para auditoria de drift geral (Cap. 8.2). Reaproveitado o mesmo número por consistência, mas isso é decisão de engenharia, não regra do SOM — pode ser ajustado sem violar o documento fonte.
3. **Prioridade de fila de clientes (RF-5.2)**: o SOM define os critérios qualitativos (Cap. 7.1) mas não define regra de urgência financeira, porque isso está fora do escopo do SOM (que é documento de marca, não financeiro). Modelado como input manual externo, não como regra derivada do SOM.
