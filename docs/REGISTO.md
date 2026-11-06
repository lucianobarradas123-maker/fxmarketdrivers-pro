# Registo do Projeto — FX Market Drivers Pro

_Última atualização: 06/11/2026 · Fase atual: 5 — Desenvolvimento · Etapa 0 concluída, a aguardar validação · Arquitetura: ver ARQUITETURA.md · Plano: ver PLANO.md_

## Perfil do utilizador
- Experiência: opera com dinheiro real há pouco tempo.
- Abordagem atual: estratégias de análise técnica, com resultados negativos.
- Hipótese do utilizador: a macroeconomia influencia mais o mercado do que a análise técnica.
- Estilo: day trading + swing trading.
- Corretora/plataforma: IC Markets com MetaTrader.
- Pares: todos os majors e a maioria dos minors (universo das 8 moedas principais: USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD).
- Volume: 1–2 operações por semana. Sem registo de operações até agora.

## Decisões tomadas
| # | Decisão | Motivo |
|---|---------|--------|
| D1 | Aplicação para uso pessoal (só 1 utilizador) | Resposta do utilizador. Simplifica autenticação, custos e regulação. |
| D2 | Finalidade: operar melhor + aprender | Resposta do utilizador. |
| D3 | Utilização em computador e telemóvel | Resposta do utilizador. Candidata: aplicação web responsiva (PWA) — a confirmar na Fase 4. |
| D4 | Construir de forma a permitir comercialização futura sem recomeçar | Boa prática; custo extra baixo. |
| D5 | Sem execução de ordens reais na primeira versão | Segurança e risco; reavaliar mais tarde com análise de riscos. |
| D6 | Diagnóstico do histórico MT adiado | Escolha do utilizador. |
| D7 | Macro organizada por moeda (8 moedas), não por par | Cobre ~28 pares com 8 conjuntos de dados; permite "força relativa". |
| D9 | Conhecimento macro: médio → app com camada educativa em cada ecrã | Resposta do utilizador (1b). |
| D10 | Prioridade MVP: Macro → Calendário → Pré-operação → Diário → Gráfico | Aprovado pelo utilizador. |
| D11 | Viés macro híbrido: parte numérica automática + leitura manual da postura dos bancos centrais, mostradas separadas | Educativo e transparente; IA pode sugerir no futuro. |
| D12 | Preços com atraso (≥15 min / gratuitos) no MVP | Preço de execução já está no MetaTrader; app serve para contexto. |
| D13 | Estilo visual: A — Noturno profissional (escuro, Inter + IBM Plex Mono) | Escolha do utilizador. |
| D14 | Cores: azul = forte/subida, laranja = fraca/descida | Acessível a daltonismo; escolha do utilizador. |
| D15 | Nome: FX Market Drivers Pro | Escolha do utilizador. |
| D16 | Adicionar volatilidade (proposta: ATR por par + nível relativo + stop vs. ATR) | Pedido do utilizador; definição exata a confirmar. |
| D17 | Volatilidade no MVP: ATR + nível relativo + stop vs. ATR; volatilidade por sessão depois | Aprovado. |
| D18 | Nome no ecrã "FX Market Drivers Pro"; nome técnico "fxmarketdrivers-pro" | Aprovado. Design fechado. |
| D19 | Stack aprovada: Next.js + TypeScript + Tailwind, Lightweight Charts, Supabase, Vercel, GitHub privado | Ver ARQUITETURA.md. |
| D20 | Calendário: registo manual dos eventos de alto impacto (módulo preparado para fonte automática futura) | Gratuito; prepara a semana. |
| D21 | Plataforma: MT5 → opção futura de calendário MQL5 e importação de relatórios MT5 | Resposta do utilizador. |
| D22 | Orçamento: até 30 €/mês; começar a 0 € e só pagar se um limite gratuito bloquear | Resposta do utilizador. |
| D23 | Testes automáticos com Vitest para toda a lógica de cálculo | Cálculos financeiros têm de ser verificáveis. |
| D8 | Diário com registo manual rápido na 1.ª versão; importação MT fica para depois | Com 1–2 operações/semana, registo manual é viável e mais rico. |

## Conceito em formação
"Copiloto pessoal de trading": junta contexto macro + análise técnica + diário de operações,
e mede com dados reais o que funciona (ou não) para o utilizador.

## Perguntas em aberto
- Validação da Etapa 0 pelo utilizador.
- Ligação da conta GitHub ao Claude (repositório: lucianobarradas123-maker/fxmarketdrivers-pro).

## Tarefas pendentes
- [x] Etapa 0 — Fundações: projeto Next.js 16, estilo A em tokens, navegação (computador + telemóvel),
      painel principal com dados de exemplo, 5 ecrãs "em construção", manifest PWA, 6 testes da lógica macro
- [ ] Ligar repositório GitHub (aguarda ligação da conta em claude.ai/connect-github)
- [ ] Etapa 1 — Painel macro com dados reais
- [ ] Testar Twelve Data (velas H1/H4) antes da Etapa 5
- [ ] Mapear séries macro (FRED/DBnomics) das 8 economias antes da Etapa 1

## Referências
- Design aprovado: https://claude.ai/artifact/JqrTj1b737EdC6wxtWwP4e
- MT4 ou MT5 (para importação futura).

## Notas técnicas para fases futuras
- MetaTrader permite exportar histórico (relatório HTML/CSV) — importação por ficheiro é a via mais segura.
- MT5 tem integração Python (só Windows); acesso só-leitura possível com "investor password".
- Massive (antigo Polygon.io) testado em 06/11/2026: velas diárias EUR/USD ✅, horárias ❌ (plano atual); macro só EUA.
