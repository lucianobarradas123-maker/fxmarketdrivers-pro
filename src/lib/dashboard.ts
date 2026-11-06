/** Junta os dados e calcula o que o painel mostra. Macro = real; preços e técnica = exemplo (eventos vêm do calendário). */
import { SAMPLE_PAIRS } from "@/lib/data/sample";
import type { Currency, CurrencyMacro } from "@/lib/data/types";
import { getMacro } from "@/lib/macro/build";
import { alignment, biasFrom, pairDivergence, volLevel } from "@/lib/macro/score";

export function getDashboard() {
  // Macro: dados reais (OCDE + leitura manual dos bancos centrais) — Etapa 1.
  const currencies = getMacro().map((c) => ({
    code: c.code,
    bank: c.bank,
    dataScore: c.dataScore,
    stance: c.stance,
    total: c.total,
  }));
  const byCode = new Map<Currency, CurrencyMacro>(currencies.map((c) => [c.code, c]));

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

  return {
    currencies,
    pairs,
    strongest,
    weakest,
    widest,
    marketVol,
  };
}
