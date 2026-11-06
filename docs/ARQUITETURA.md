# Arquitetura — FX Market Drivers Pro

_Fase 4 — Arquitetura · proposta de 06/11/2026 · estado: APROVADA_

## 1. Visão geral

```
 Telemóvel / Computador (browser, instalável como app — PWA)
                │  HTTPS + sessão autenticada
                ▼
 ┌──────────────────────────────────────────┐
 │  Aplicação Next.js (frontend + servidor) │  ← alojada na Vercel
 │  - Ecrãs (React)                         │
 │  - Rotas de servidor (chaves API aqui)   │
 │  - Tarefas agendadas (recolha de dados)  │
 └───────────────┬──────────────────────────┘
                 │
     ┌───────────┴───────────┐
     ▼                       ▼
 Base de dados            Fontes externas
 PostgreSQL (Supabase)    - Preços FX
 - diário, definições     - Dados macro
 - cache de dados         - Calendário económico
   c/ fonte + hora
```

Regra de ouro: **o browser nunca fala diretamente com as fontes de dados** — tudo passa pelo servidor,
que guarda as chaves API, faz cache e regista origem/hora de cada valor.

## 2. Tecnologias (recomendação + alternativas)

| Camada | Recomendado | Alternativas consideradas | Porquê |
|---|---|---|---|
| Frontend | Next.js + React + TypeScript | SvelteKit; Vue/Nuxt | Maior ecossistema, PWA fácil, frontend e servidor no mesmo projeto. TypeScript apanha erros cedo. |
| Estilos | Tailwind CSS (tokens do estilo A) | CSS Modules | Rápido de manter consistente com o design aprovado. |
| Gráfico de velas | TradingView Lightweight Charts | ECharts; Highcharts (pago comercial) | Gratuito (Apache 2.0, exige atribuição), leve, feito para finanças. |
| Outros gráficos | Recharts | ECharts; D3 | Simples para barras/estatísticas do diário. |
| Backend | Rotas de servidor do Next.js | API separada em Python (FastAPI) | Um só projeto = menos complexidade. Python fica como opção futura (backtesting/IA). |
| Base de dados | PostgreSQL gerido (Supabase) | SQLite local; Neon | Acesso de qualquer dispositivo; inclui autenticação e regras de acesso. |
| Autenticação | Supabase Auth + 2FA (TOTP) | Passkeys; Auth.js | App exposta à internet ⇒ login obrigatório mesmo sendo só para 1 pessoa. |
| Alojamento | Vercel (plano Hobby) | Netlify; servidor próprio | Gratuito para uso pessoal não comercial; publicação automática a partir do GitHub. |
| Código | Repositório GitHub privado | — | Histórico, cópia de segurança, publicação automática. |

### Limitações a conhecer
- **Vercel Hobby**: só uso pessoal/não comercial. Se comercializar → plano pago.
- **Supabase gratuito**: o projeto é pausado após ~1 semana sem utilização (reativa-se manualmente); limites de espaço. Para uso diário não é problema; plano pago se necessário.
- Condições e preços de terceiros mudam — confirmar antes de cada adesão.

## 3. Fontes de dados

| Necessidade | Fonte candidata | Origem | Frequência | Limitações |
|---|---|---|---|---|
| Velas diárias (ATR, tendência D1) | **Massive** (ex-Polygon.io) — testado nesta sessão | Agregação de cotações de mercado interbancário/fornecedores | Diária (barra fecha 00:00 UTC) | No plano testado: diárias ✅, horárias ❌. Preços não são os da IC Markets (diferenças pequenas). |
| Velas H1/H4 (day trading) | Twelve Data (plano gratuito) — a testar | Agregador de fornecedores FX | Intradiária, atrasada | Limite diário e por minuto de pedidos no gratuito; confirmar condições atuais. |
| Alternativa intradiária | MetaTrader 5 (preços reais IC Markets) | A própria corretora | Tempo real | Exige MT5 + PC Windows ligado a enviar dados; mais complexo. Fase posterior. |
| Inflação e desemprego (8 economias) | **OCDE — sdmx.oecd.org** ✅ em uso (D26) | Institutos de estatística nacionais, harmonizados pela OCDE | Mensal (NZ e desemprego CH trimestral); 1–3 meses de atraso de publicação | Sem chave. API recusa pedidos muito seguidos (o script espaça e repete). Desemprego suíço costuma vir mais atrasado. |
| (alternativas avaliadas) | DBnomics; FRED | — | — | DBnomics: dados parados em abr./mai. 2026. FRED: exige chave na URL. |
| Taxas de juro dos bancos centrais | Atualização manual após cada reunião (~8/ano por banco) + validação BIS | Bancos centrais | Por reunião | Manual = ~5 min por reunião; encaixa na leitura "híbrida" do BC. |
| Calendário económico | **Decisão em aberto** (ver §5) | — | — | Fontes gratuitas fiáveis são raras; scraping de sites (ex.: Forex Factory) viola os termos de uso — excluído. |

Cada valor guardado na base de dados terá: `fonte`, `obtido_em`, `tipo` (tempo real / atrasado / fim de dia / manual)
e a app mostra aviso quando um dado está desatualizado.

## 4. Segurança e responsabilidade

- Chaves API só no servidor (variáveis de ambiente cifradas na Vercel); nunca no código, nunca no browser, `.env` fora do Git.
- Login com palavra-passe forte + 2FA; sessão com expiração; regras de acesso na base de dados (Row Level Security).
- HTTPS obrigatório; cópias de segurança da base de dados.
- **Nenhuma credencial da IC Markets/MetaTrader é guardada.** Importação futura apenas por ficheiro exportado.
- Validação de dados: rejeitar valores absurdos (picos, buracos), comparar fontes quando possível, mostrar idade do dado.
- Separação Informação / Análise / Decisão em toda a interface; sem linguagem de "sinal" ou "garantia".
- Execução de ordens: **fora do âmbito**. Se for reconsiderada, exige análise prévia de riscos técnicos, de segurança e regulamentares.

## 5. Decisões
1. ✅ Stack aprovada (§2).
2. ✅ Calendário: manual (alto impacto) no MVP; MQL5 (MT5) ou API paga como evolução.
3. ✅ MT5.
4. ✅ Orçamento até 30 €/mês; arrancar a 0 €.

## 6. Implementação da autenticação e base de dados (Etapa 2)
- `src/proxy.ts`: renova a sessão e reencaminha para /login (sem sessão) ou /login/2fa (2FA por confirmar).
- `src/lib/supabase/server.ts`: cliente do servidor; ações em `actions.ts` validadas com zod.
- Tabelas: `eventos`, `leituras_bancos` — RLS `user_id = auth.uid()` e `sessao_segura()` (aal2 se houver 2FA).
- Migrações: `npm run db:migrate`; testes de segurança: `npm run db:test` (anula tudo no fim).
- Variáveis públicas: `.env.example` (URL e publishable key). Nenhuma chave secreta na app.
