# Registo do Projeto — FX Market Drivers Pro

_Última atualização: 06/11/2026 · Fase atual: 5 — Desenvolvimento · Fase 7 (preparação para uso a longo prazo) — ver docs/FASE6-RELATORIO.md e /ajuda na app · app em https://fxmarketdrivers-pro-syjy.vercel.app · Arquitetura: ver ARQUITETURA.md · Plano: ver PLANO.md_

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
| D46 | Sentimento de risco próprio (0–100): VIX (CBOE) + S&P 500 (SPY) + AUD/JPY + ouro invertido, cada um vs. média de 50 dias; entra na força das moedas com peso até ±0,5 conforme a sensibilidade de cada moeda (AUD/NZD +1, CAD +0,5, GBP +0,25, EUR 0, USD −0,5, CHF/JPY −1) | Pedido do utilizador; CNN Fear & Greed é de ações e sem API oficial. |
| D47 | Valor do pip confirmado pelo utilizador contra o MetaTrader (IC Markets) | A diferença inicial era de cotação simulada (1,20). |
| D48 | Sentimento do retalho: Myfxbook Community Outlook (API oficial) como filtro de confirmação em extremos (>70%), não como sinal isolado | Aprovado; utilizador já tem conta. |
| D49 | Retalho: extremo a partir de 70% num lado; critério só conta quando há extremo; credenciais Myfxbook só na Vercel (palavra-passe exclusiva, sem contas reais ligadas) | Segurança e uso como filtro. |
| D50 | Funções com cache que dependem de fontes externas nunca lançam erro: devolvem { error } com cache de minutos | Com Cache Components, um erro na pré-geração parte a build (aconteceu uma vez, corrigido). |
| D51 | Análise de discursos: texto colado ou link (https público; HTML ou PDF), Claude Opus 5.5, esforço "high", resposta estruturada validada, fallbacks "default"; guarda texto, link e análise no evento (RLS) | Pedido do utilizador; custo ~0,05–0,15 €/análise. |
| D52 | Citações da IA verificadas automaticamente contra o texto (✓ encontrada / ! não encontrada / PDF não verificável) | Reduz o risco de interpretações sem base. |
| D53 | Links lidos pelo servidor só se forem https públicos (sem IPs, localhost ou redes internas), máx. 3 redireções e 10 MB | Segurança (evita uso do servidor contra endereços internos). |
| D54 | Leitura do BC: a editada na app (tabela leituras_bancos) prevalece sobre a inicial do ficheiro; a IA só sugere, o utilizador aplica | Princípio híbrido (D11). |
| D55 | Pares em destaque = 5 pares de maior divergência macro, máx. 2 aparições por moeda; preços num único pedido em lote | Variedade e limite de 8 pedidos/min da Twelve Data. |
| D56 | Confirmação obrigatória quando a análise de um texto custar > 0,15 $ (estimativa ~3,3 caracteres/token) | Evitar surpresas de custo (página inteira custou 0,33 $). |
| D57 | Estratégias: SMC, Divergência de Forças, Outra · Emoções: calmo, confiante, ansioso, impaciente, FOMO, a recuperar perdas | Respostas do utilizador. |
| D58 | Operação registada ao entrar (a partir da pré-operação, com contexto e checklist) e fechada depois; R = pips ÷ stop; € calculado ou o real do MT5 | Contexto honesto no momento da decisão. |
| D59 | Capturas num espaço privado do Supabase (pasta por utilizador, RLS + 2FA), reduzidas no browser a ≤1920 px WebP | Limite de 4,5 MB por pedido na Vercel; espaço gratuito de 1 GB. |
| D60 | Estatísticas por: macro vs técnica, a favor/contra a macro, checklist, eventos < 2h, seguiu o plano, estratégia, emoção, sentimento, retalho, par; aviso de amostra pequena (< 50) | Responde às perguntas do utilizador com os seus dados. |
| D61 | Conversão do pip para EUR com as taxas de referência do BCE (diárias, sem chave); Twelve Data só como alternativa | Erro reportado pelo utilizador: limite de 8 pedidos/min ultrapassado ao mudar de par; poupa 1 pedido por par. |
| D62 | Preços: falhas nunca ficam em cache; limite por minuto devolve 429 e a pré-operação volta a tentar sozinha após 60 s | Mensagens claras em vez do erro genérico do Next.js. |
| D63 | Ecrã Pares: H4 = direção, H1 = entrada, D1 = contexto; EMA 8/21 (exponenciais); tendência = preço vs EMA8 vs EMA21; ATR(14) por período | Preferências do utilizador. |
| D64 | Suportes/resistências automáticos: fractais (2 velas de cada lado) do H4 (~50 dias), agrupados a ½ ATR do H4, 3 níveis de cada lado com n.º de toques | Transparente e reproduzível. |
| D65 | Velas intradiárias: só horas de mercado (sem sexta 22h–domingo 21h UTC); todos os pedidos em UTC | Velas planas de fim de semana distorciam médias e ATR. |
| D66 | Dados macro atualizados por GitHub Actions com curl (o servidor da OCDE responde 500 ao cliente HTTP do Node); atualização parcial se uma parte falhar | Primeira execução falhou por isso; corrigido e testado. |
| D67 | CSP "sem nonces" (só recursos do próprio site) + páginas de erro próprias; função de 2FA no esquema privado | Fase 6. |
| D68 | Proteção HaveIBeenPwned não ativada (só plano Pro do Supabase) | Mitigada por palavra-passe forte + 2FA. |
| D69 | Cópias de segurança: exportação pelo utilizador (JSON completo / CSV com proteção contra fórmulas) + lembrete se > 30 dias | Plano gratuito sem cópias recuperáveis. |
| D70 | Tarefa GitHub de 3 em 3 dias chama public.manter_ativo() (devolve 1) com a chave publicável | Evitar pausa por inatividade do Supabase gratuito. |
| D71 | Manual de utilização dentro da app (/ajuda): rotina, indicadores, fontes, custos e limites, segurança, problemas | Sempre à mão; sem domínio próprio (decisão do utilizador). |
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
- [x] Pré-operação testada pelo utilizador; valor do pip confirmado contra o MT5
- [x] Sentimento de risco (cartão no painel, painel no Macro, componente na força das moedas, aviso na pré-operação); 42 testes
- [x] Sentimento do retalho (Myfxbook): código feito (login → outlook → logout, cache 1h); 6.º critério opcional na pré-operação; linha "Retalho" nos pares em destaque; 48 testes
- [ ] Utilizador: criar MYFXBOOK_EMAIL e MYFXBOOK_PASSWORD (Secret) na Vercel + Redeploy; confirmar dados no site
- [x] Sentimento do retalho confirmado pelo utilizador (EUR/USD 85% comprados = Myfxbook)
- [x] Análise de discursos com IA (construída): página por evento (/calendario/[id]) com texto ou link (HTML/PDF), Claude Opus 5.5 com respostas estruturadas e reserva automática, verificação das citações, sugestão de leitura do BC; 55 testes
- [x] Análise de discursos testada pelo utilizador (2 análises GBP, todas as citações verificadas; 0,06 $ e 0,33 $)
- [x] Leituras dos bancos centrais editáveis na app (ecrã Macro) + botão "Aplicar sugestão" nas análises; pré-operação e IA usam a leitura editada
- [x] Pares em destaque com dados reais: 5 pares de maior divergência (máx. 2 por moeda), tendência/ATR reais, link para a pré-operação
- [x] Aviso de custo antes de analisar textos longos (> 0,15 $ estimado)
- [x] Etapa 4 (construída): definições da conta na base de dados; registar operação a partir da pré-operação com contexto e checklist; captura de ecrã privada (reduzida no browser); fechar com preço de saída (resultado em pips, R e €, ou € real do MT5); estatísticas por 10 dimensões; histórico; cartões do painel com dados reais; sem dados de exemplo na app; 67 testes + 18 verificações de segurança
- [x] Diário testado pelo utilizador sem erros; correção do limite de pedidos confirmada
- [ ] Importar histórico do MT5 (pedido para mais tarde)
- [x] Etapa 5 (construída): ecrã Pares com gráfico de velas H4/H1/D1, EMA 8 e 21, ATR, suportes/resistências automáticos, tendência por período e confirmação H1 vs H4, contexto macro; 78 testes
- [x] Atualização automática dos dados macro (GitHub Actions, segundas e quintas; testada com sucesso); dados de outubro já incluídos
- [ ] Serviço de email próprio (SMTP) — opcional, passos dados ao utilizador
- [x] Ecrã Pares testado pelo utilizador
- [x] Fase 6: segurança (função 2FA privada, CSP, npm audit 0), desempenho (LCP ~1,1 s em telemóvel lento), acessibilidade (0 violações), páginas de erro em PT, "Pares" na barra do telemóvel
- [x] Fase 7: exportação dos dados (JSON completo e CSV para Excel) + lembrete mensal no painel; tarefa automática para o Supabase não pausar; manual de utilização com custos e limites (página /ajuda)
- [ ] SMTP próprio (opcional, utilizador)
- [ ] Painel e "Pares em destaque": passar a usar tendência e ATR reais (hoje ainda de exemplo)
- [ ] Testar Twelve Data (velas H1/H4) antes da Etapa 5

## Referências
- Design aprovado: https://claude.ai/artifact/JqrTj1b737EdC6wxtWwP4e
- MT4 ou MT5 (para importação futura).

## Notas técnicas para fases futuras
- MetaTrader permite exportar histórico (relatório HTML/CSV) — importação por ficheiro é a via mais segura.
- MT5 tem integração Python (só Windows); acesso só-leitura possível com "investor password".
- Massive (antigo Polygon.io) testado em 06/11/2026: velas diárias EUR/USD ✅, horárias ❌ (plano atual); macro só EUA.
