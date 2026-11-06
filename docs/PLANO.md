# Plano do Projeto — FX Market Drivers Pro

_Fase 2 — Planeamento · 06/11/2026_

## 1. Conceito
Aplicação pessoal (web responsiva: computador + telemóvel) que ajuda um trader de day/swing
a decidir melhor ANTES de entrar numa operação, juntando contexto macroeconómico e análise técnica,
e a aprender com as próprias operações através de um diário.

**Frase-guia:** "Perceber o contexto, controlar o risco, registar e aprender."

**Não é:** uma plataforma de execução, nem um gerador de sinais. Não promete lucros.

## 2. Princípios
1. Educativo por defeito (nível macro "médio"): cada número tem um "o que significa isto?".
2. Transparência dos dados: cada valor mostra fonte, hora da última atualização e se é tempo real/atrasado.
3. Separação clara: **Informação** (factos) · **Análise** (interpretação) · **Decisão** (sempre do utilizador).
4. Risco primeiro: nenhuma operação é registada sem risco definido.
5. Simples: registar uma operação em < 1 minuto.

## 3. Funcionalidades do MVP (por prioridade)

### M1 — Painel macro por moeda (8 moedas)
- Por moeda: taxa de juro atual, inflação vs. meta, emprego/crescimento, postura do banco central.
- Ranking de força macro (mais forte → mais fraca).
- Pares com maior divergência macro em destaque.
- Explicação curta de cada indicador.

### M2 — Calendário de eventos
- Eventos de alto/médio impacto das 8 moedas.
- Filtro por moeda/par; contagem decrescente para o próximo evento importante.
- Valores: anterior, previsão, atual (quando disponível).

### M3 — Pré-operação
- Calculadora de tamanho de posição (saldo, % risco, stop em pips, par → lotes).
- Rácio risco/retorno.
- Aviso automático de eventos de alto impacto nas próximas X horas.
- Checklist personalizável do plano de trading.

### M4 — Diário rápido
- Registo manual: par, direção, entrada, stop, alvo, lotes, resultado, motivo, emoção, seguiu o plano?
- Contexto guardado automaticamente: viés macro do par e eventos próximos no momento da entrada.
- Lista e estatísticas básicas (taxa de acerto, R médio, resultado por par).

### M1b — Volatilidade (pedido do utilizador)
- ATR(14) diário por par, em pips.
- Nível relativo: Baixa / Normal / Elevada (ATR atual vs. média de 20 dias).
- Indicador de volatilidade geral do mercado no painel.
- Na pré-operação: stop comparado com o ATR (ex.: "0,35× ATR — apertado").

### M5 — Gráfico do par + alinhamento
- Gráfico de velas (H1/H4/D1) com médias móveis.
- Tendência técnica simples vs. viés macro → "Alinhado / Em conflito / Neutro".

### Versões futuras (não no MVP)
Estatísticas avançadas · IA de análise de desempenho · Simulador · Importação MetaTrader ·
Alertas/notificações · Backtesting.

## 4. Etapas de desenvolvimento
| Etapa | Conteúdo | Resultado testável |
|-------|----------|--------------------|
| 0 | Fundações: projeto, design system, navegação, dados de exemplo | App navegável com ecrãs vazios |
| 1 | M1 Painel macro | Ver as 8 moedas e o ranking |
| 2 | M2 Calendário | Ver eventos e filtrar por par |
| 3 | M3 Pré-operação | Calcular lotes e ver avisos |
| 4 | M4 Diário | Registar e consultar operações |
| 5 | M5 Gráfico + alinhamento | Ver par com gráfico e estado de alinhamento |
| 6 | Polimento, telemóvel (PWA), testes | Instalar no telemóvel |

## 5. Decisões em aberto (Fase 2)
- ✅ Viés macro: híbrido (D11).
- ✅ Preços: atrasados/gratuitos no MVP (D12).
