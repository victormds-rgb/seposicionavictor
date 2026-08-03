# INTERACTION_MODEL.md
### SEPosicionaVictor — Modelo de Interação

## 1. Filosofia de Interação

Minimizar atrito; reduzir carga cognitiva; ações previsíveis (mesma tecla/gesto sempre produz o mesmo efeito); consistência entre módulos; velocidade (teclado sempre disponível); contexto preservado ao trocar de módulo.

## 2. Navegação

Navegação principal sempre a um gesto de distância. Navegação contextual soma-se à principal, nunca a substitui. Breadcrumbs em caminhos profundos. Histórico de navegação recente acessível. Voltar/Avançar respeitam comportamento padrão do navegador.

## 3. Command Palette

`Ctrl+K`/`Cmd+K`, inspirada em Raycast/Linear/Cursor. Permite: abrir módulo, pesquisar entidade, executar comando, criar registro, navegar rapidamente, acionar ação contextual. Fecha automaticamente após ação.

## 4. Quick Capture

Atalho `Q`, disponível em qualquer tela, nunca interrompe o fluxo atual. Aceita texto, áudio, imagem, link, arquivo. Nunca pergunta "isso é o quê?" no momento da captura — só objetivo é não perder a informação.

## 5. Busca Global

Mesmo `Ctrl+K` ou atalho `/`. Resultados progressivos, agrupados por tipo, navegáveis por teclado (setas + Enter). `Cmd+Enter`/`Ctrl+Enter` abre em painel secundário.

## 6. Hotkeys

`Ctrl+K`/`Cmd+K` (Command Palette/Busca), `Q` (Quick Capture), `/` (foco em busca local), `Esc` (fechar camada ativa), `Cmd+Enter`/`Ctrl+Enter` (confirmar ação), `G` + letra (navegação "go to"), `?` (lista de atalhos). Nenhum atalho global é reatribuído por módulo específico.

## 7. Seleção

Única (clique/toque simples). Múltipla (`Shift+clique` intervalo, `Ctrl/Cmd+clique` individual). Ações em lote só mostram ações válidas para todos os itens selecionados.

## 8. Context Menu

Clique direito (desktop) / long press (mobile) com ações específicas da entidade. Nunca é a única forma de acessar uma ação importante.

## 9. Drag & Drop

Usado para reordenar (prioridade manual) e mover RegistroBruto para destino. Evitado como única via de ação e em qualquer ação irreversível (nunca usado para descartar).

## 10. Estados de Interação

Hover (realce leve, sem mudança de layout), Focus (contorno visível e consistente via Tab), Selected (distinto de hover), Disabled (sempre com explicação), Pending (aguardando confirmação humana, visualmente distinto de loading), Loading (leve, localizado), Erro (mensagem + ação de recuperação), Sincronizando (discreto).

## 11. Fluxo de Aprovação da IA

Aceitar (um gesto, `Cmd+Enter`), Editar (abre modo editável, registra diferença), Rejeitar (gesto distinto, campo de motivo opcional), Solicitar nova sugestão (mantém histórico da anterior), Comparar versões (alternância entre sugestões).

## 12. Workspace

"Workspace Atual" é o contexto momentâneo de trabalho. Preservado ao abrir Command Palette/busca/Alerta. Trocar de workspace é ação explícita (navegação para outro módulo/entidade principal). Anterior fica no Histórico.

## 13. Focus Mode

Ativado manualmente para concentração (conteúdo longo, revisão de Case). Oculta Alertas e pendências não-críticas temporariamente, sem descartar nada. Sai com `Esc` ou toggle, tudo reaparece.

## 14. Mobile Interactions

Swipe para ações rápidas em listas. Long press para menu contextual. Quick Capture como botão fixo sempre visível. Integração com compartilhamento nativo do SO. Atalhos de teclado físico não se aplicam — gestos e widgets no lugar.

## 15. Evolução Futura — Agents e Missions

Agents acionados pela mesma Command Palette, sem tela/atalho separado. Missions usam o mesmo Fluxo de Aprovação da IA repetido a cada etapa. Progresso de Missão aparece como parte do Workspace Atual. Nenhum atalho novo introduzido — Command Palette absorve novos comandos como itens adicionais. Princípio permanente: qualquer nova autonomia de IA deve caber no vocabulário já definido (aceitar/editar/rejeitar/solicitar nova sugestão/comparar versões).
