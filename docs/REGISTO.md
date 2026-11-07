# Registo do Projeto — FX Market Drivers Pro

_Última atualização: 06/11/2026 · Fase atual: 5 — Desenvolvimento · Etapa 3 construída (falta a chave Twelve Data na Vercel) · app em https://fxmarketdrivers-pro-syjy.vercel.app · Arquitetura: ver ARQUITETURA.md · Plano: ver PLANO.md_

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
| D24 | Leitura dos bancos centrais em 5 níveis (+1, +0,5, 0, −0,5, −1); avalia a direção da próxima decisão | Com subidas generalizadas, 3 níveis não distinguiam as moedas. Aprovado. |
| D25 | Leituras iniciais aprovadas: Fed e BoE restritivo; BCE, BoJ, BoC, RBA lig. restritivo; RBNZ neutro; SNB lig. expansionista | Ver docs/BANCOS-CENTRAIS.md. |
| D26 | Fonte macro automática: API pública da OCDE (sdmx.oecd.org), sem chave | DBnomics testado: dados parados em abr./mai. 2026 (6 meses de atraso). OCDE tem dados até set. 2026. |
| D27 | Dados macro guardados num "retrato" (src/data/macro-snapshot.json) atualizado com `npm run data:macro` | Dados mensais mudam pouco; a app nunca falha por a fonte externa estar em baixo; cada valor guarda fonte e data. Automatizar mais tarde. |
| D28 | Parte "Dados" = média de 3 pontuações z entre as 8 moedas (juro, inflação vs. meta, variação do desemprego em 6 meses) × 1,5, limitada a ±2 | Mede força relativa, que é o que importa no Forex. Fórmula transparente, mostrada no ecrã. A rever com o uso. |
| D29 | Taxas de juro mantidas manualmente | BIS via DBnomics parado em jun. 2025; as taxas mudam só ~8×/ano. |
| D30 | Ambiente cloud próprio "fxmarketdrivers-pro" com acesso a api.db.nomics.world e sdmx.oecd.org | Necessário para obter dados; não altera o ambiente Default. |
| D31 | Base de dados e login antecipados para a Etapa 2 (Supabase, projeto kbfncjkxhhfsueuzbgrp, região UE) | Calendário precisa de guardar dados; diário e leituras dos BC também. Aprovado. |
| D32 | Estrutura da base de dados gerida por migrações (supabase/migrations, `npm run db:migrate`) com token via formulário seguro | Escolha do utilizador (2a). Token nunca no código nem no chat. |
| D33 | Segurança: RLS por utilizador + exigência de sessão aal2 quando há 2FA; anónimos sem acesso; testes automáticos (`npm run db:test`) | Proteção na própria base de dados, não só na app. |
| D34 | Palavra-passe: mínimo 12 caracteres, maiúsculas, minúsculas e números | Configurado no Supabase e validado na app. |
| D35 | Registo aberto só até o utilizador criar a conta; depois desligado | App de um só utilizador. |
| D36 | Mantido Cache Components do Next.js (partes com sessão carregam em Suspense) | Será obrigatório na próxima versão do Next.js. |
| D37 | Alojamento: Vercel Hobby, publicação automática a partir do ramo main | Gratuito para uso pessoal. |
| D38 | Variáveis do Supabase só no servidor (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY), tipo Secret na Vercel | A Vercel não aceita NEXT_PUBLIC_ como Secret; e a chave deixa de ir para o browser. |
| D39 | Conta de trading em EUR; risco padrão 1% por operação | Resposta do utilizador (Etapa 3). |
| D40 | Checklist da pré-operação: a favor do viés macro; tendência técnica confirma; stop ≥ 0,5× ATR; sem evento de alto impacto nas próximas 2h; R/R ≥ 1:1,5 | Aprovado pelo utilizador. |
| D41 | Catálogo de eventos alargado com os que o utilizador inseriu à mão; eventos têm tipo (dado/decisão/discurso/política) | Pedido do utilizador; prepara a análise de discursos. |
| D42 | Preços: Twelve Data (plano gratuito, 8 pedidos/min, 800/dia), barras diárias em cache durante horas | Escolha do utilizador (2a). Chave só no servidor. |
| D43 | ATR(14) e tendência (preço vs. médias de 20 e 50 dias) calculados só com barras diárias completas de dias úteis | A Twelve Data devolve barras de fim de semana e do dia em curso, que baixariam o ATR. |
| D44 | Lotes sempre arredondados PARA BAIXO a 0,01 (nunca arriscar mais do que a regra) | Gestão de risco. |
| D45 | Saldo, % de risco e último par guardados no dispositivo (localStorage) | Conveniência; não é informação crítica. |
| D8 | Diário com registo manual rápido na 1.ª versão; importação MT fica para depois | Com 1–2 operações/semana, registo manual é viável e mais rico. |

## Conceito em formação
"Copiloto pessoal de trading": junta contexto macro + análise técnica + diário de operações,
e mede com dados reais o que funciona (ou não) para o utilizador.

## Perguntas em aberto
- Validação da Etapa 1 pelo utilizador.

## Tarefas pendentes
- [x] Etapa 0 — Fundações: projeto Next.js 16, estilo A em tokens, navegação (computador + telemóvel),
      painel principal com dados de exemplo, 5 ecrãs "em construção", manifest PWA, 6 testes da lógica macro
- [x] Repositório GitHub ligado: https://github.com/lucianobarradas123-maker/fxmarketdrivers-pro
- [x] Etapa 1 — Macro com dados reais: fichas dos 8 bancos centrais, inflação e desemprego da OCDE,
      parte "Dados" automática, escala de 5 níveis, ecrã Macro, painel principal com ranking real, aviso de dados antigos
- [ ] Automatizar `npm run data:macro` (agendamento) — antes do lançamento
- [ ] Rever leituras dos bancos centrais após as reuniões de dezembro (8–18/12)
- [x] Etapa 2 (construída): login + registo + 2FA (TOTP) + página Conta; calendário com catálogo de eventos,
      valor real, apagar; painel principal ligado ao calendário (próximo evento com contagem decrescente)
- [x] Publicada na Vercel: https://fxmarketdrivers-pro-syjy.vercel.app (publica sozinha a cada push no GitHub)
- [x] Supabase: site_url e redirect URL configurados para o endereço publicado
- [x] Cabeçalhos de segurança HTTP (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy)
- [ ] Política de segurança de conteúdo (CSP) — avaliar antes do uso intensivo
- [x] Utilizador criou a conta (email confirmado) e ativou a 2FA; registo de novas contas desligado
- [x] Calendário testado pelo utilizador (2 eventos registados)
- [ ] Serviço de email próprio (SMTP) antes do lançamento — o de teste do Supabase só envia 2/hora e para a equipa
- [ ] Edição da leitura dos bancos centrais na app (tabela leituras_bancos já existe)
- [ ] PROPOSTA em discussão: texto dos discursos + análise com IA (tom restritivo/expansionista, direção futura, dados a vigiar)
- [x] Etapa 3 (construída): calculadora de lotes em EUR, R/R, stop vs. ATR, aviso de eventos, checklist automática com 5 critérios; 33 testes
- [ ] Utilizador: acrescentar TWELVE_DATA_API_KEY (Secret) na Vercel e fazer Redeploy; testar a pré-operação
- [ ] Painel e "Pares em destaque": passar a usar tendência e ATR reais (hoje ainda de exemplo)
- [ ] Testar Twelve Data (velas H1/H4) antes da Etapa 5

## Referências
- Design aprovado: https://claude.ai/artifact/JqrTj1b737EdC6wxtWwP4e
- MT4 ou MT5 (para importação futura).

## Notas técnicas para fases futuras
- MetaTrader permite exportar histórico (relatório HTML/CSV) — importação por ficheiro é a via mais segura.
- MT5 tem integração Python (só Windows); acesso só-leitura possível com "investor password".
- Massive (antigo Polygon.io) testado em 06/11/2026: velas diárias EUR/USD ✅, horárias ❌ (plano atual); macro só EUA.
