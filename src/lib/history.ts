/**
 * Históricos (funções puras, testadas em history.test.ts):
 *  - sentimento de risco dia a dia, com a MESMA fórmula do indicador atual (D46);
 *  - força das moedas pelo preço: desempenho de cada moeda face à média das 8 (D72).
 */
import type { Currency } from "@/lib/data/types";
import { computeRisk, type RiskComponent } from "@/lib/sentiment";

export interface Point {
  date: string; // AAAA-MM-DD
  close: number;
}

export interface RiskDay {
  date: string;
  index: number;
  scores: Record<RiskComponent["key"], number>;
}

/** Valor "à data": último ponto com data ≤ d (os mercados têm calendários diferentes). */
function asOf(points: Point[], d: string, from: number): number {
  let i = from;
  while (i + 1 < points.length && points[i + 1].date <= d) i++;
  return i;
}

/**
 * Sentimento de risco para cada dia de negociação do S&P 500 (a partir do 50.º dia de histórico).
 * Usa, para cada componente, só dados disponíveis até esse dia (sem olhar para o futuro).
 */
export function riskHistory(input: { vix: Point[]; spx: Point[]; audjpy: Point[]; gold: Point[] }, sma = 50): RiskDay[] {
  const out: RiskDay[] = [];
  let iv = 0;
  let ia = 0;
  let ig = 0;
  for (let k = sma - 1; k < input.spx.length; k++) {
    const d = input.spx[k].date;
    iv = asOf(input.vix, d, iv);
    ia = asOf(input.audjpy, d, ia);
    ig = asOf(input.gold, d, ig);
    if (input.vix[iv].date > d || ia < sma - 1 || ig < sma - 1) continue;
    const window = (pts: Point[], end: number) => pts.slice(end - sma + 1, end + 1).map((p) => p.close);
    const r = computeRisk({
      vix: input.vix[iv].close,
      spx: window(input.spx, k),
      audjpy: window(input.audjpy, ia),
      gold: window(input.gold, ig),
      asOf: d,
    });
    out.push({ date: d, index: r.index, scores: Object.fromEntries(r.components.map((c) => [c.key, c.score])) as RiskDay["scores"] });
  }
  return out;
}

export const CURRENCIES_ORDER: Currency[] = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD"];

/** Os 7 pares contra o USD chegam para saber o valor de cada moeda face às outras (os cruzamentos derivam deles). */
export const USD_LEGS: Record<Exclude<Currency, "USD">, { pair: string; invert: boolean }> = {
  EUR: { pair: "EUR/USD", invert: false },
  GBP: { pair: "GBP/USD", invert: false },
  AUD: { pair: "AUD/USD", invert: false },
  NZD: { pair: "NZD/USD", invert: false },
  CAD: { pair: "USD/CAD", invert: true },
  CHF: { pair: "USD/CHF", invert: true },
  JPY: { pair: "USD/JPY", invert: true },
};

export interface StrengthDay {
  date: string;
  values: Record<Currency, number>; // % acumulado face à média das 8, desde o 1.º dia
}

/**
 * Força pelo preço: para cada dia, o desempenho acumulado (log, em %) de cada moeda em USD menos a média das 8.
 * Por ser linear em logaritmos, para mudar o início do período basta subtrair o valor nesse dia.
 */
export function priceStrength(legs: Record<string, Point[]>): StrengthDay[] {
  const maps = Object.fromEntries(
    Object.entries(USD_LEGS).map(([c, l]) => [c, new Map((legs[l.pair] ?? []).map((p) => [p.date, l.invert ? 1 / p.close : p.close]))]),
  ) as Record<Exclude<Currency, "USD">, Map<string, number>>;
  const dates = [...(maps.EUR?.keys() ?? [])].filter((d) => Object.values(maps).every((m) => m.has(d))).sort();
  if (!dates.length) return [];
  const first = dates[0];
  return dates.map((d) => {
    const logs: Record<string, number> = { USD: 0 };
    for (const c of Object.keys(maps) as Exclude<Currency, "USD">[]) logs[c] = Math.log(maps[c].get(d)! / maps[c].get(first)!);
    const mean = Object.values(logs).reduce((s, v) => s + v, 0) / 8;
    return {
      date: d,
      values: Object.fromEntries(CURRENCIES_ORDER.map((c) => [c, Math.round((logs[c] - mean) * 10000) / 100])) as Record<Currency, number>,
    };
  });
}

/** Recomeça a série em 0 no 1.º dia do período escolhido. */
export function rebase(series: StrengthDay[], fromDate: string): StrengthDay[] {
  const s = series.filter((d) => d.date >= fromDate);
  if (!s.length) return [];
  const base = s[0].values;
  return s.map((d) => ({
    date: d.date,
    values: Object.fromEntries(CURRENCIES_ORDER.map((c) => [c, Math.round((d.values[c] - base[c]) * 100) / 100])) as Record<Currency, number>,
  }));
}
