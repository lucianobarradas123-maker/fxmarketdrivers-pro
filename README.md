# FX Market Drivers Pro

Aplicação pessoal de apoio ao trading Forex: contexto macro + análise técnica + gestão de risco + diário.

> Informação e análise para apoio à decisão. Não é aconselhamento financeiro nem garante resultados.

## Documentação do projeto
- [docs/REGISTO.md](docs/REGISTO.md) — decisões tomadas, tarefas feitas e pendentes
- [docs/PLANO.md](docs/PLANO.md) — conceito, funcionalidades e etapas
- [docs/ARQUITETURA.md](docs/ARQUITETURA.md) — tecnologias, fontes de dados e segurança
- Design aprovado: https://claude.ai/artifact/JqrTj1b737EdC6wxtWwP4e

## Como correr localmente
```bash
npm install
npm run dev      # abre em http://localhost:3000
npm test         # testes da lógica de cálculo
npm run build    # build de produção
```

## Estrutura
```
src/
  app/                 páginas (Visão geral, Macro, Calendário, Pré-operação, Diário, Pares)
  components/layout/   barra superior e navegação do telemóvel
  components/ui/       peças reutilizáveis (cartões, etiquetas, origem dos dados)
  components/dashboard/ blocos do painel principal
  lib/data/            tipos e dados de EXEMPLO (Etapa 0)
  lib/macro/           cálculos: força macro, viés, alinhamento, volatilidade (+ testes)
```
