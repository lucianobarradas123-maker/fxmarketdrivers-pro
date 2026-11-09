/** Junta os dados e calcula o que o painel mostra. Macro = real; preços e técnica = exemplo (eventos vêm do calendário). */
import { SAMPLE_PAIRS } from "@/lib/data/sample";
import type { Currency } from "@/lib/data/types";
import { getMacro } from "@/lib/macro/build";
import { alignment, biasFrom, volLevel } from "@/lib/macro/score";
import type { RiskSentiment } from "@/lib/sentiment";
import { readRetail, retailText } from "@/lib/retail";
import type { RetailData } from "@/lib/retail-data";

export function getDashboard(risk: RiskSentiment | null, retail: RetailData | null = null) {
  // Macro: dados reais (OCDE + leitura manual dos bancos centrais + sentimento de risco).
  const currencies = getMacro(risk).map((c) => ({
    code: c.code,
    bank: c.bank,
    dataScore: c.dataScore,
    stance: c.stance,
    riskScore: c.riskScore,
    total: c.total,
  }));
  const totalOf = new Map<Currency, number>(currencies.map((c) => [c.code, c.total]));

  const pairs = SAMPLE_PAIRS.map((p) => {
    const [base, quote] = p.pair.split("/") as [Currency, Currency];
    const divergence = Math.round((totalOf.get(base)! - totalOf.get(quote)!) * 10) / 10;
    const bias = biasFrom(divergence);
    return {
      ...p,
      divergence,
      bias,
      alignment: alignment(bias, p.trend),
      vol: volLevel(p.atrPips, p.atrAvg20Pips),
      retail: (() => {
        const r = retail?.pairs[p.pair];
        if (!r) return null;
        const read = readRetail(r);
        return { text: retailText(read), extreme: read.extreme };
      })(),
    };
  });

  const strongest = currencies[0];
  const weakest = currencies[currencies.length - 1];
  const widest = [...pairs].sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence))[0];

  return {
    currencies,
    pairs,
    strongest,
    weakest,
    widest,
    risk,
  };
}
