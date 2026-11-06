/**
 * DADOS DE EXEMPLO — não são dados reais de mercado.
 * Servem apenas para construir e testar a interface na Etapa 0.
 * Serão substituídos por fontes reais nas Etapas 1, 2 e 5 (ver docs/ARQUITETURA.md).
 */
import type { CurrencyMacro, DataMeta, EconomicEvent, PairSnapshot } from "./types";

export const SAMPLE_META: DataMeta = {
  source: "Dados de exemplo",
  fetchedAt: "2026-11-06T14:32:00Z",
  kind: "exemplo",
};

/** "Agora" fixo para os exemplos, para que as contagens decrescentes sejam coerentes. */
export const SAMPLE_NOW = "2026-11-06T11:16:00Z";

export const SAMPLE_ACCOUNT = { balance: 10_000, riskPct: 1 };

export const SAMPLE_CURRENCIES: CurrencyMacro[] = [
  { code: "USD", bank: "Fed", dataScore: 1.2, stance: "Restritivo" },
  { code: "GBP", bank: "BoE", dataScore: 1.1, stance: "Neutro" },
  { code: "AUD", bank: "RBA", dataScore: -0.4, stance: "Restritivo" },
  { code: "CAD", bank: "BoC", dataScore: 0.2, stance: "Neutro" },
  { code: "EUR", bank: "BCE", dataScore: -0.4, stance: "Neutro" },
  { code: "NZD", bank: "RBNZ", dataScore: 0.1, stance: "Expansionista" },
  { code: "CHF", bank: "SNB", dataScore: -0.5, stance: "Expansionista" },
  { code: "JPY", bank: "BoJ", dataScore: -0.8, stance: "Expansionista" },
];

export const SAMPLE_PAIRS: PairSnapshot[] = [
  { pair: "USD/JPY", trend: "ascendente", atrPips: 112, atrAvg20Pips: 92 },
  { pair: "USD/CHF", trend: "ascendente", atrPips: 64, atrAvg20Pips: 66 },
  { pair: "AUD/USD", trend: "descendente", atrPips: 58, atrAvg20Pips: 60 },
  { pair: "GBP/JPY", trend: "descendente", atrPips: 165, atrAvg20Pips: 135 },
  { pair: "EUR/GBP", trend: "ascendente", atrPips: 38, atrAvg20Pips: 50 },
  { pair: "EUR/USD", trend: "lateral", atrPips: 72, atrAvg20Pips: 68 },
];

export const SAMPLE_EVENTS: EconomicEvent[] = [
  { time: "2026-11-06T13:30:00Z", currency: "USD", name: "Payroll não-agrícola (NFP)", impact: "alto" },
  { time: "2026-11-06T13:30:00Z", currency: "USD", name: "Taxa de desemprego", impact: "alto" },
  { time: "2026-11-06T15:00:00Z", currency: "CAD", name: "Ivey PMI", impact: "médio" },
  { time: "2026-11-09T00:30:00Z", currency: "AUD", name: "Confiança empresarial NAB", impact: "baixo" },
];

export const SAMPLE_JOURNAL = { weekTrades: 2, weekR: 1.4, followedPlan: 2, totalTrades: 14, reliableSample: 50 };
