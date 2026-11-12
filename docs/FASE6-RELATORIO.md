# Fase 6 — Testes e otimização (relatório)

_12/11/2026_

## Segurança
| Verificação | Resultado |
|---|---|
| Análise automática do Supabase (segurança) | 1 aviso corrigido (função da 2FA passou para esquema privado `privado`, não exposta pela API). Restante: proteção contra palavras-passe comprometidas (HaveIBeenPwned) — **só no plano Pro**; mitigado por palavra-passe ≥ 12 caracteres + 2FA. |
| Análise automática do Supabase (desempenho) | Sem avisos. |
| Regras de acesso (RLS) — `npm run db:test` | 18/18 verificações corretas após a migração 0004. |
| Vulnerabilidades em bibliotecas (`npm audit --omit=dev`) | 0. |
| Política de segurança de conteúdo (CSP) | Ativa: só recursos do próprio site; sem violações no login, registo e gráfico. |
| Cabeçalhos | HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, CSP. |

## Desempenho (telemóvel simulado: CPU 4× mais lenta, rede móvel)
| Página | 1.º conteúdo | Maior conteúdo | Saltos de layout | JS |
|---|---|---|---|---|
| /login | 1,1 s | 1,1 s | 0 | ~135 KB |
| /registo | 1,2 s | 1,2 s | 0 | ~139 KB |

Lighthouse não corre neste ambiente (NO_FCP em modo sem ecrã); medições feitas com Playwright + Performance API.

## Acessibilidade
axe-core (WCAG 2.1 AA + boas práticas) em /login e /registo: **0 violações**.
Páginas com sessão não podem ser auditadas automaticamente daqui (exigem a conta do utilizador).

## Robustez
- Páginas de erro próprias em português (erro de página com "Tentar de novo" e código; erro global; 404).
- Fontes externas: falhas não ficam em cache; mensagens claras; nova tentativa automática no limite de pedidos.

## Usabilidade
- "Pares" acrescentado à barra inferior do telemóvel (antes só acessível pelo painel).

## Limitações conhecidas
- Testes de ponta a ponta com sessão iniciada dependem do utilizador (não é possível criar utilizadores de teste neste ambiente).
- Plano gratuito do Supabase: sem cópias de segurança automáticas acessíveis; projeto pausa após ~7 dias sem uso → tratar na Fase 7.
