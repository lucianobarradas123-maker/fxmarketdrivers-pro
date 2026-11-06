/** Junta os dados (de exemplo, por agora) e calcula o que o painel mostra. */
import { SAMPLE_CURRENCIES, SAMPLE_EVENTS, SAMPLE_NOW, SAMPLE_PAIRS } from "@/lib/data/sample";
import type { Currency } from "@/lib/data/types";
import { alignment, biasFrom, pairDivergence, totalScore, volLevel } from "@/lib/macro/score";

export function getDashboard() {
  const currencies = SAMPLE_CURRENCIES.map((c) => ({ ...c, total: totalScore(c) })).sort(
    (a, b) => b.total - a.total,
  );
  const byCode = new Map(SAMPLE_CURRENCIES.map((c) => [c.code, c]));

  const pairs = SAMPLE_PAIRS.map((p) => {
    const [base, quote] = p.pair.split("/") as [Currency, Currency];
    const divergence = pairDivergence(byCode.get(base)!, byCode.get(quote)!);
    const bias = biasFrom(divergence);
    return {
      ...p,
      divergence,
      bias,
      alignment: alignment(bias, p.trend),
      vol: volLevel(p.atrPips, p.atrAvg20Pips),
    };
  });

  const strongest = currencies[0];
  const weakest = currencies[currencies.length - 1];
  const widest = [...pairs].sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence))[0];

  const avgRatio = pairs.reduce((s, p) => s + p.atrPips / p.atrAvg20Pips, 0) / pairs.length;
  const marketVol = {
    level: volLevel(avgRatio, 1),
    changePct: Math.round((avgRatio - 1) * 100),
  };

  const now = new Date(SAMPLE_NOW).getTime();
  const upcoming = SAMPLE_EVENTS.filter((e) => new Date(e.time).getTime() > now);
  const nextHigh = upcoming.find((e) => e.impact === "alto");
  const affectedPairs = nextHigh ? pairs.filter((p) => p.pair.includes(nextHigh.currency)).length : 0;

  return {
    currencies,
    pairs,
    strongest,
    weakest,
    widest,
    marketVol,
    events: upcoming,
    nextHigh,
    minutesToNextHigh: nextHigh ? Math.round((new Date(nextHigh.time).getTime() - now) / 60000) : null,
    affectedPairs,
  };
}
