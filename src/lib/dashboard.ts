/** Junta os dados e calcula o que o painel mostra. Tudo real, exceto o cartão do diário (Etapa 4). */
import type { Currency, Trend, VolLevel } from "@/lib/data/types";
import { getMacro, type Readings } from "@/lib/macro/build";
import { alignment, biasFrom, volLevel, type Alignment, type Bias } from "@/lib/macro/score";
import { PAIRS, currenciesOf } from "@/lib/pairs";
import { readRetail, retailText } from "@/lib/retail";
import type { RetailData } from "@/lib/retail-data";
import { atrAverage, atrPips, trendOf, type Bar } from "@/lib/risk";
import type { RiskSentiment } from "@/lib/sentiment";

export const FEATURED_COUNT = 5;
/** Cada moeda aparece no máximo 2 vezes nos destaques (evita uma lista só de pares com a mesma moeda). */
export const MAX_PER_CURRENCY = 2;

/** Escolhe os pares de maior divergência respeitando o limite por moeda. */
export function pickFeatured<T extends { pair: string; divergence: number }>(ranked: T[], count = FEATURED_COUNT, maxPer = MAX_PER_CURRENCY): T[] {
  const used = new Map<string, number>();
  const out: T[] = [];
  for (const r of [...ranked].sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence))) {
    const [b, q] = r.pair.split("/");
    if ((used.get(b) ?? 0) >= maxPer || (used.get(q) ?? 0) >= maxPer) continue;
    out.push(r);
    used.set(b, (used.get(b) ?? 0) + 1);
    used.set(q, (used.get(q) ?? 0) + 1);
    if (out.length === count) break;
  }
  return out;
}

export interface FeaturedPair {
  pair: string;
  divergence: number;
  bias: Bias;
  trend: Trend | null;
  alignment: Alignment | null;
  atrPips: number | null;
  vol: VolLevel | null;
  retail: { text: string; extreme: boolean } | null;
}

/** Macro de todas as moedas + os pares com maior divergência (sem preços: servem para escolher o que pedir). */
export function macroAndFeatured(risk: RiskSentiment | null, readings: Readings) {
  const macro = getMacro(risk, readings);
  const totalOf = new Map<Currency, number>(macro.map((c) => [c.code, c.total]));
  const ranked = PAIRS.map((pair) => {
    const [b, q] = currenciesOf(pair);
    return { pair, divergence: Math.round((totalOf.get(b)! - totalOf.get(q)!) * 10) / 10 };
  });
  return { macro, featured: pickFeatured(ranked) };
}

export function getDashboard(
  risk: RiskSentiment | null,
  retail: RetailData | null,
  readings: Readings,
  bars: Record<string, Bar[]> | null,
) {
  const { macro, featured } = macroAndFeatured(risk, readings);
  const currencies = macro.map((c) => ({
    code: c.code,
    bank: c.bank,
    dataScore: c.dataScore,
    stance: c.stance,
    riskScore: c.riskScore,
    total: c.total,
  }));

  const pairs: FeaturedPair[] = featured.map(({ pair, divergence }) => {
    const bias = biasFrom(divergence);
    const b = bars?.[pair];
    let trend: Trend | null = null;
    let atr: number | null = null;
    let vol: VolLevel | null = null;
    if (b) {
      try {
        trend = trendOf(b);
        atr = Math.round(atrPips(b, pair));
        vol = volLevel(atrPips(b, pair), atrAverage(b, pair));
      } catch {
        /* histórico insuficiente: fica sem técnica */
      }
    }
    const r = retail?.pairs[pair];
    const read = r ? readRetail(r) : null;
    return {
      pair,
      divergence,
      bias,
      trend,
      alignment: trend ? alignment(bias, trend) : null,
      atrPips: atr,
      vol,
      retail: read ? { text: retailText(read), extreme: read.extreme } : null,
    };
  });

  return {
    currencies,
    pairs,
    strongest: currencies[0],
    weakest: currencies[currencies.length - 1],
    widest: pairs[0],
    risk,
    pricesAvailable: bars !== null,
  };
}
