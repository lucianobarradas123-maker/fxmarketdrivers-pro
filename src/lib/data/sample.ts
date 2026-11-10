/**
 * DADOS DE EXEMPLO — não são dados reais de mercado.
 * Servem apenas para construir e testar a interface na Etapa 0.
 * Os dados macro já são reais (Etapa 1). Os restantes serão substituídos nas Etapas 2 a 5 (ver docs/ARQUITETURA.md).
 */
import type { DataMeta } from "./types";

export const SAMPLE_META: DataMeta = {
  source: "Dados de exemplo",
  fetchedAt: "2026-11-06T14:32:00Z",
  kind: "exemplo",
};

export const SAMPLE_ACCOUNT = { balance: 10_000, riskPct: 1 };

export const SAMPLE_JOURNAL = { weekTrades: 2, weekR: 1.4, followedPlan: 2, totalTrades: 14, reliableSample: 50 };
