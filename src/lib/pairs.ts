import type { Currency } from "@/lib/data/types";

/** Ordem de prioridade do mercado (qual moeda é a base): EUR > GBP > AUD > NZD > USD > CAD > CHF > JPY. */
const PRIORITY: Currency[] = ["EUR", "GBP", "AUD", "NZD", "USD", "CAD", "CHF", "JPY"];

/** Os 28 pares entre as 8 moedas principais, na convenção do mercado (ex.: EUR/USD, USD/JPY). */
export const PAIRS: string[] = PRIORITY.flatMap((base, i) => PRIORITY.slice(i + 1).map((quote) => `${base}/${quote}`));

export const MAJORS = ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD"];

export function isPair(p: string): boolean {
  return PAIRS.includes(p);
}

export function currenciesOf(pair: string): [Currency, Currency] {
  return pair.split("/") as [Currency, Currency];
}
