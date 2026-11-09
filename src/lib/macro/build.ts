/** Junta as fichas dos bancos centrais (manual) com os dados da OCDE (automático). */
import { BANKS_REVIEWED_AT, CENTRAL_BANKS } from "@/data/central-banks";
import snapshot from "@/data/macro-snapshot.json";
import type { Currency } from "@/lib/data/types";
import { computeDataScores, monthsBehind, type MacroSnapshotEntry } from "./data-score";
import { STANCE_POINTS } from "./score";
import { riskContribution, type RiskSentiment } from "@/lib/sentiment";

export { MACRO_META } from "./meta";

const entries = snapshot.currencies as Partial<Record<Currency, MacroSnapshotEntry>>;

/** Mais de 4 meses de atraso face à recolha → aviso de dado desatualizado. */
export const STALE_MONTHS = 4;

/**
 * Força macro de cada moeda. Total = Dados + Banco central + Sentimento de risco (D46), limitado a ±3.
 * @param risk sentimento de risco atual; null → componente a zero (fonte indisponível).
 */
export function getMacro(risk: RiskSentiment | null = null) {
  const scores = computeDataScores(CENTRAL_BANKS, entries);
  return CENTRAL_BANKS.map((b) => {
    const s = scores.find((x) => x.code === b.code)!;
    const m = entries[b.code]!;
    const riskScore = riskContribution(b.code, risk?.index ?? null);
    const total = Math.max(-3, Math.min(3, s.dataScore + STANCE_POINTS[b.stance] + riskScore));
    return {
      ...b,
      macro: m,
      components: s.components,
      dataScore: s.dataScore,
      riskScore,
      total: Math.round(total * 10) / 10,
      stale: {
        inflation: monthsBehind(m.inflation.period, snapshot.fetchedAt) > STALE_MONTHS,
        unemployment: monthsBehind(m.unemployment.period, snapshot.fetchedAt) > STALE_MONTHS,
      },
    };
  }).sort((a, b) => b.total - a.total);
}

export { BANKS_REVIEWED_AT };
