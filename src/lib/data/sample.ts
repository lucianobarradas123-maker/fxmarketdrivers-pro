/**
 * DADOS DE EXEMPLO — não são dados reais de mercado.
 * Servem apenas para construir e testar a interface na Etapa 0.
 * Os dados macro já são reais (Etapa 1). Os restantes serão substituídos nas Etapas 2 a 5 (ver docs/ARQUITETURA.md).
 */
import type { DataMeta, PairSnapshot } from "./types";

export const SAMPLE_META: DataMeta = {
  source: "Dados de exemplo",
  fetchedAt: "2026-11-06T14:32:00Z",
  kind: "exemplo",
};

export const SAMPLE_ACCOUNT = { balance: 10_000, riskPct: 1 };

export const SAMPLE_PAIRS: PairSnapshot[] = [
  { pair: "USD/JPY", trend: "ascendente", atrPips: 112, atrAvg20Pips: 92 },
  { pair: "USD/CHF", trend: "ascendente", atrPips: 64, atrAvg20Pips: 66 },
  { pair: "AUD/USD", trend: "descendente", atrPips: 58, atrAvg20Pips: 60 },
  { pair: "GBP/JPY", trend: "descendente", atrPips: 165, atrAvg20Pips: 135 },
  { pair: "EUR/GBP", trend: "ascendente", atrPips: 38, atrAvg20Pips: 50 },
  { pair: "EUR/USD", trend: "lateral", atrPips: 72, atrAvg20Pips: 68 },
];

export const SAMPLE_JOURNAL = { weekTrades: 2, weekR: 1.4, followedPlan: 2, totalTrades: 14, reliableSample: 50 };
