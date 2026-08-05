# Gap Report — Visão de Produto

O que ainda separa este sistema de um produto SaaS maduro, olhando só
para a experiência de quem usa — sem propor código ou arquitetura. Uma
ressalva importante corre por todo este documento: o SEPosicionaVictor
**não é um SaaS comercial** — é uma ferramenta pessoal de usuário único
(`docs/SOFTWARE_SPEC.md`). Vários gaps abaixo só importam se e quando a
ambição do produto mudar; onde isso se aplica, está marcado.

---

## 1. O sistema não avisa — você tem que ir perguntar

Todo SaaS maduro de CRM/gestão de conteúdo empurra informação até você
(e-mail, notificação push, badge de contagem). Aqui, Alertas só existem
se alguém entrar na tela e olhar — e nem isso sozinho, porque o Job que
gera Alertas precisa ser acionado manualmente hoje. Um produto que exige
que você lembre de perguntar "aconteceu algo?" perde para qualquer
concorrente que simplesmente te avisa.

## 2. Não existe busca

Nenhum CRM ou ferramenta de conteúdo minimamente madura obriga o usuário
a rolar uma lista inteira para achar um registro. Aqui, só a Inbox tem
filtro/busca — Clientes, Projetos, Conteúdo e Conhecimento não têm
nenhuma forma de busca. Isso já está especificado como "Busca Global" no
próprio `docs/INTERACTION_MODEL.md`, mas nunca foi construído.

## 3. Nenhuma visão consolidada por Cliente

Produtos de CRM maduros têm uma "página do cliente" com tudo num só
lugar: histórico, projetos, conteúdo, próximos passos. Aqui, a mesma
informação está fragmentada em três telas sem link entre si — o usuário
é quem precisa montar o quadro completo na cabeça.

## 4. Nada é editável depois de criado

Lead, Registro Bruto rejeitado, respostas da árvore de conversão — nada
disso tem um caminho de correção. Produtos maduros assumem que humanos
erram digitação e sempre oferecem editar. Aqui, um erro de digitação no
nome de um Lead fica lá para sempre.

## 5. Interface não é responsiva/mobile

A interface hoje é HTML funcional, sem adaptação para tela pequena. Quick
Capture funciona em qualquer navegador (inclusive celular), mas o resto
do sistema — revisar Alertas, tratar Inbox, avançar Pipeline — pressupõe
desktop. Um produto SaaS competitivo de hoje é usável no bolso.

## 6. Nenhum onboarding guiado dentro do produto

Um usuário novo (mesmo sendo o próprio dono do sistema, numa reinstalação
ou depois de meses sem usar) não tem nenhuma orientação dentro da
aplicação — só documentação externa em arquivos Markdown do repositório,
que não é lida no fluxo real de uso. Produtos maduros têm checklist de
primeiros passos dentro da própria tela.

## 7. Sem exportação de dados própria

Não há botão "exportar meus dados" em nenhuma tela — nem as métricas
mensais, nem a lista de clientes, nem o conteúdo publicado. Depender só
de acesso direto ao banco (Supabase) para tirar qualquer relatório é uma
barreira que um produto maduro não impõe ao próprio dono dos dados.

## 8. Nenhum rastro de auditoria visível ao usuário

O sistema registra tecnicamente cada evento de domínio (`event_log`),
mas isso nunca aparece em nenhuma tela — o usuário não consegue perguntar
"o que mudou aqui e quando" sem acesso direto ao banco. Produtos maduros
expõem um histórico de atividade, mesmo que básico.

## 9. Nenhuma automação além dos dois Jobs fixos

Todo SaaS de operação hoje oferece algum nível de "se X, então Y"
configurável pelo próprio usuário. Aqui, a única automação existente são
dois Jobs com regra fixa no código — não há espaço para o usuário
definir uma regra nova sem depender de alguém mexer no sistema.

## 10. Sem nenhum canal de suporte/ajuda dentro do produto

Sem chat, sem central de ajuda, sem busca na documentação de dentro da
aplicação — a única forma de "pedir ajuda" é abrir o repositório de
código. Irrelevante enquanto for uso pessoal; vira um problema real no
dia em que outra pessoa (mesmo que só um assistente/funcionário) precisar
usar o sistema sem o dono do produto por perto.

---

## O que **não** é gap — decisão de escopo, não lacuna

Para não confundir "falta" com "não existe por decisão consciente"
(`docs/ARCHITECTURE.md`, seção 26):

- **Sem multi-usuário/permissões** — correto para um sistema de usuário
  único; só vira gap real se a ambição mudar para atender mais de uma
  pessoa.
- **Sem modo offline** — explicitamente fora de escopo, não é uma falha.
- **Sem billing/assinatura/trial** — não é um produto vendido, não
  precisa disso hoje.
- **Sem dashboard de vaidade (curtidas, views, alcance)** — ausência
  deliberada, alinhada ao próprio SOM (Cap. 9.7: "não vaidade como
  métrica principal").
