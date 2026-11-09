/**
 * Sentimento de risco ("medo ↔ ganância") — indicador próprio (D46), 0 = medo extremo, 100 = ganância extrema.
 * Funções puras, testadas em sentiment.test.ts.
 *
 * Componentes (cada um de −1 a +1; positivo = apetite pelo risco):
 *  - VIX: volatilidade esperada das ações dos EUA. 20 = neutro; 10 → +1; 30 → −1.
 *  - S&P 500 (ETF SPY) face à média de 50 dias: +5% → +1.
 *  - AUD/JPY face à média de 50 dias: +3% → +1 (barómetro clássico do risco no Forex).
 *  - Ouro face à média de 50 dias: INVERTIDO (+5% → −1), porque sobe com a procura de refúgio.
 */
import type { Currency } from "@/lib/data/types";

export interface RiskComponent {
  key: "vix" | "spx" | "audjpy" | "ouro";
  label: string;
  value: number; // valor de referência (VIX ou % face à média)
  score: number; // −1 … +1
}

export interface RiskSentiment {
  index: number; // 0 … 100
  label: string;
  components: RiskComponent[];
  asOf: string; // data do dado mais antigo usado
}

const clamp = (x: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, x));
const round2 = (x: number) => Math.round(x * 100) / 100;

export function vsSma(closes: number[], n = 50): number {
  if (closes.length < n) throw new Error(`São precisos pelo menos ${n} fechos`);
  const sma = closes.slice(-n).reduce((s, v) => s + v, 0) / n;
  return closes[closes.length - 1] / sma - 1;
}

export function riskLabel(index: number): string {
  if (index < 25) return "Medo extremo";
  if (index < 45) return "Medo";
  if (index <= 55) return "Neutro";
  if (index <= 75) return "Ganância";
  return "Ganância extrema";
}

export function computeRisk(input: { vix: number; spx: number[]; audjpy: number[]; gold: number[]; asOf: string }): RiskSentiment {
  const spx = vsSma(input.spx);
  const aj = vsSma(input.audjpy);
  const gold = vsSma(input.gold);
  const components: RiskComponent[] = [
    { key: "vix", label: "VIX (medo nas ações)", value: round2(input.vix), score: round2(clamp((20 - input.vix) / 10)) },
    { key: "spx", label: "S&P 500 vs. média 50d", value: round2(spx * 100), score: round2(clamp(spx / 0.05)) },
    { key: "audjpy", label: "AUD/JPY vs. média 50d", value: round2(aj * 100), score: round2(clamp(aj / 0.03)) },
    { key: "ouro", label: "Ouro vs. média 50d (invertido)", value: round2(gold * 100), score: round2(-clamp(gold / 0.05)) },
  ];
  const mean = components.reduce((s, c) => s + c.score, 0) / components.length;
  const index = Math.round(50 + 50 * mean);
  return { index, label: riskLabel(index), components, asOf: input.asOf };
}

/**
 * Sensibilidade de cada moeda ao apetite pelo risco: positiva = moeda de risco (ganha com ganância),
 * negativa = refúgio (ganha com medo).
 */
export const RISK_BETA: Record<Currency, number> = {
  AUD: 1,
  NZD: 1,
  CAD: 0.5,
  GBP: 0.25,
  EUR: 0,
  USD: -0.5,
  CHF: -1,
  JPY: -1,
};

/** Peso máximo do sentimento na pontuação total (±0,5). */
export const RISK_WEIGHT = 0.5;

/** Contributo do sentimento para a força de uma moeda (−0,5 … +0,5). */
export function riskContribution(code: Currency, index: number | null): number {
  if (index === null) return 0;
  return round2(RISK_BETA[code] * ((index - 50) / 50) * RISK_WEIGHT) || 0; // evita "−0"
}
