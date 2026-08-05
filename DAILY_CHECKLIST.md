# Checklists de Operação

Checklists práticos, para marcar de verdade. Complementa
[`OPERATION_GUIDE.md`](OPERATION_GUIDE.md) (o "como" e "por quê") com o
"não esqueci de nada?" rápido.

---

## Checklist diário

- [ ] Abri o Dashboard e olhei Alertas ativos antes de qualquer outra coisa
- [ ] Não há Alerta `desvio_pilares` ou `auditoria_devida` sem tratamento
      (ver [`OPERATION_GUIDE.md`](OPERATION_GUIDE.md) para o que fazer
      com cada tipo)
- [ ] Conferi a Agenda do dia — nada `agendado` que já passou do horário
      sem eu saber por quê
- [ ] Capturei (Quick Capture, `Q`) tudo que aconteceu hoje que vale a
      pena não perder — não deixei para "lembrar depois"
- [ ] Zerei ou reduzi a fila de pendências da Inbox (sugestões de IA
      aguardando aceitar/editar/rejeitar)
- [ ] Fiz o bloco da rotina semanal fixa do dia (ver tabela em
      `OPERATION_GUIDE.md`) e marquei como concluído na Agenda
- [ ] Se teve reunião hoje: marquei como realizada na Agenda **e**
      capturei as notas na Inbox no mesmo dia (não no dia seguinte)
- [ ] Se um Lead avançou de fase no Pipeline: registrei o passo
      correspondente (qualificação, agendamento, confirmação) no mesmo
      dia da conversa, não de memória depois

## Checklist semanal

- [ ] **Segunda:** rodei "Instanciar rotina desta semana" na Agenda
- [ ] **Segunda:** escolhi o caso/tendência da semana para "A Desculpa
      da Semana"
- [ ] **Terça:** publiquei um Build Log de verdade para cada projeto
      "Produto próprio" ativo — é o único jeito de evitar o Alerta
      `build_log_ausente` antes dele aparecer
- [ ] **Quarta:** publiquei a análise crítica da semana
- [ ] **Quinta:** publiquei o bastidor/erro da semana
- [ ] **Sexta:** revisei a Distribuição de Pilares no Dashboard —
      algum pilar com desvio grande que precisa de atenção nas próximas
      semanas?
- [ ] **Sexta:** agendei os compromissos da semana seguinte
- [ ] **Sexta:** respondi comentários/interações pendentes
- [ ] Rodei manualmente o Job `monitor-de-consistencia`
      (`npm run jobs:run -- monitor-de-consistencia`) pelo menos uma vez
      na semana — hoje é a única forma de gerar Alertas novos, não
      acontece sozinho (ver limitação documentada em
      [`DEPLOY_VERCEL.md`](DEPLOY_VERCEL.md))
- [ ] Nenhum Lead ficou parado na mesma fase do Pipeline por mais de uma
      semana sem eu saber por quê

## Checklist mensal

- [ ] Revisei as métricas de acompanhamento (SOM Cap. 9.7): leads/
      contatos citando conteúdo específico, quantas vezes um framework/
      termo próprio foi repetido por terceiros, taxa de resposta a
      Build Logs — **não** métrica de vaidade (curtidas, views)
- [ ] Atualizei o repositório de cases com qualquer Case novo publicado
      no mês
- [ ] Verifiquei sinais preliminares de drift de marca — mesmo sem
      esperar o Alerta `auditoria_devida` aparecer
- [ ] Chequei se algum Cliente "convertido" está sem Projeto criado há
      mais de um mês — sinal de que o onboarding travou em algum lugar
- [ ] Chequei se `auditoria_devida` está próxima de disparar (90 dias
      desde a última Auditoria de Drift) — se estiver perto, já
      planeje quando vai rodar a auditoria trimestral (ver abaixo)

### Lembrete trimestral (não é todo mês, mas rastreie aqui)

- [ ] Rodei a Auditoria de Drift (SOM Cap. 8.2): revisar os últimos 20
      conteúdos publicados contra os Caps. 1.8 e 2.7. Se mais de 30%
      falharem, **pausar produção nova e revisar o Fundamento** antes de
      continuar — essa é uma regra dura, não uma sugestão.
